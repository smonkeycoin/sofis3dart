/* eslint-disable @typescript-eslint/no-require-imports */
// Offline reconciliation of read-only production exports. No provider writes or sends.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v;
const sha = v => crypto.createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(canonical(v))).digest('hex');
const norm = s => (s || '').trim().toLowerCase();
function reconcile(d, sessions, intents) {
  if (d.raffle.id !== '5336ec30-ac68-49f6-afa6-f194ba4ca0aa' || d.raffle.slug !== 'apple-watch-se-3-2026') throw Error('Wrong raffle');
  if (d.raffle_tickets.length !== 50 || new Set(d.raffle_tickets.map(t => t.ticket_number)).size !== 50 || d.raffle_tickets.some(t => t.ticket_number < 1 || t.ticket_number > 50)) throw Error('Incomplete 50-ticket inventory');
  const problems = [];
  const participants = d.raffle_tickets.toSorted((a,b) => a.ticket_number-b.ticket_number).map(t => {
    const paid = d.raffle_orders.filter(o => o.ticket_id === t.id && o.status === 'PAID');
    const order = paid.length === 1 ? paid[0] : null;
    const events = d.raffle_events.filter(e => e.ticket_id === t.id);
    const session = sessions.find(s => s.id === order?.stripe_checkout_session_id);
    const intent = intents.find(i => i.id === order?.stripe_payment_intent_id);
    const charge = intent?.latest_charge;
    const cash = events.find(e => e.event_type === 'PAYMENT_SUCCEEDED' && e.metadata.payment_method === 'cash' && e.metadata.order_id === order?.id);
    const base = !!order && t.status === 'PAID' && order.amount === 34700 && order.currency === 'MXN' && !!order.buyer_name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm(order.buyer_email));
    const stripeVerified = base && !!session && !!intent && session.livemode === true && intent.livemode === true && session.status === 'complete' && session.payment_status === 'paid' && session.amount_total === 34700 && session.currency === 'mxn' && intent.status === 'succeeded' && intent.amount_received === 34700 && intent.currency === 'mxn' && charge?.paid === true && charge?.captured === true && charge?.amount_refunded === 0 && charge?.disputed === false && norm(session.customer_details?.email) === norm(order.buyer_email) && session.metadata?.order_id === order.id && session.metadata?.raffle_slug === d.raffle.slug && Number(session.metadata?.ticket_number) === t.ticket_number && intent.metadata?.order_id === order.id && intent.metadata?.raffle_slug === d.raffle.slug && Number(intent.metadata?.ticket_number) === t.ticket_number && t.stripe_checkout_session_id === session.id && t.stripe_payment_intent_id === intent.id;
    const cashVerified = base && !order.stripe_checkout_session_id && !order.stripe_payment_intent_id && !!cash && cash.metadata.amount_cents === 34700 && cash.metadata.currency === 'MXN' && !!cash.metadata.basis && !!cash.metadata.manual_reference && events.some(e => e.event_type === 'TICKET_PAID' && e.metadata.order_id === order.id);
    const verified = Boolean(stripeVerified || cashVerified);
    if (t.status === 'PAID' && !verified) problems.push({ type: 'PAID_TICKET_UNVERIFIED', ticket_number: t.ticket_number });
    if (paid.length > 1) problems.push({ type: 'MULTIPLE_PAID_ORDERS', ticket_number: t.ticket_number });
    return { ticket_number: String(t.ticket_number).padStart(2,'0'), status: t.status, owner_name: order?.buyer_name ?? null, owner_email: order?.buyer_email ?? null, payment_method: cashVerified ? 'CASH' : order?.stripe_checkout_session_id ? 'STRIPE' : null, payment_verified: verified, eligible: null, eligibility_status: verified ? 'PAID_PENDING_RULES_APPROVAL' : 'NOT_ELIGIBLE', assigned_at: t.purchased_at, payment_reference: cash?.metadata.manual_reference ?? order?.stripe_payment_intent_id ?? null, order_id: order?.id ?? null, ticket_id: t.id, stripe_checkout_session_id: order?.stripe_checkout_session_id ?? null, charge_id: charge?.id ?? null, evidence_event_ids: events.filter(e => e.metadata.order_id === order?.id && ['PAYMENT_SUCCEEDED','TICKET_PAID'].includes(e.event_type)).map(e => e.id) };
  });
  for (const i of intents.filter(i => i.metadata?.raffle_slug === d.raffle.slug && i.status === 'succeeded' && i.latest_charge?.amount_refunded !== i.amount_received)) {
    if (!d.raffle_orders.some(o => o.stripe_payment_intent_id === i.id && o.status === 'PAID')) {
      const s = sessions.find(s => (typeof s.payment_intent === 'object' ? s.payment_intent?.id : s.payment_intent) === i.id);
      const owner = participants.find(p => Number(p.ticket_number) === Number(i.metadata.ticket_number));
      problems.push({ type:'STRIPE_SUCCEEDED_DATABASE_NOT_PAID', ticket_number:Number(i.metadata.ticket_number), payment_intent:i.id, order_id:i.metadata.order_id, amount_received:i.amount_received, amount_refunded:i.latest_charge?.amount_refunded ?? null, disputed:i.latest_charge?.disputed ?? null, same_email_as_current_owner:!!s?.customer_details?.email && norm(s.customer_details.email) === norm(owner?.owner_email), buyer_email:s?.customer_details?.email ?? null });
    }
  }
  const grouped = new Map();
  for (const p of participants.filter(p => p.payment_verified)) {
    const email = norm(p.owner_email);
    if (!grouped.has(email)) grouped.set(email, { recipient:email, owner_name:p.owner_name, ticket_numbers:[], order_ids:[] });
    grouped.get(email).ticket_numbers.push(p.ticket_number); grouped.get(email).order_ids.push(p.order_id);
  }
  const recipients = [...grouped.values()].sort((a,b) => a.recipient.localeCompare(b.recipient)).map(r => ({ campaign_id:'raffle_relaunch_2026_11_01_v1', ...r, idempotency_key:`raffle_relaunch_2026_11_01_v1/${sha(r.recipient)}`, resend_message_id:null, delivery_status:'NOT_SENT', send_status:'BLOCKED_PENDING_APPROVAL_AND_VALIDATION' }));
  return { participants, problems, recipients };
}
function writeReport(dir) {
  const read = n => JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
  const save = (n,v) => fs.writeFileSync(path.join(dir,n),JSON.stringify(v,null,2)+'\n',{mode:0o600});
  const d=read('supabase-current-private.json'), sessions=read('stripe-sessions-private.json'), intents=read('stripe-intents-private.json');
  if (sessions.has_more || intents.has_more) throw Error('Incomplete Stripe pagination');
  const result=reconcile(d,sessions.data,intents.data);
  save('raffle_participants_private.json',{captured_at:d.captured_at,source:'production',...result});
  save('campaign_manifest_private.json',{campaign_id:'raffle_relaunch_2026_11_01_v1',subject:'🎁 ¡El Apple Watch todavía busca ganador! Nueva fecha de la rifa',preheader:'Tus boletos siguen participando. Conoce la nueva fecha del sorteo de Sofi.',recipient_count:result.recipients.length,recipients:result.recipients,approved:false,sent:0});
  const candidate=result.participants.filter(p=>p.payment_verified).map(p=>({ticket_number:p.ticket_number,status:p.eligibility_status}));
  save('raffle_eligible_numbers.json',candidate);
  save('raffle_ticket_states_public.json',result.participants.map(p=>({ticket_number:p.ticket_number,status:p.status})));
  const hashes=Object.fromEntries(['raffle_tickets','raffle_orders','raffle_events'].map(k=>[k,sha(d[k])]));
  const record={kind:'AUDIT_CANDIDATE_NOT_FINAL_DRAW_ROSTER',version:1,captured_at:d.captured_at,draw_at:'2026-11-02T00:00:00.000Z',timezone:'America/Cancun',canonicalization:'recursive lexicographic object keys; array order preserved; UTF-8 compact JSON',sha256:sha(candidate),source_sha256:hashes,tickets:candidate};
  const filename=`eligibility-candidate-${d.captured_at.replace(/[:.]/g,'-')}-${record.sha256}.json`;
  const file=path.join(dir,filename);
  if (!fs.existsSync(file)) { fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n',{flag:'wx',mode:0o400}); }
  else if (read(filename).sha256!==record.sha256) throw Error('Snapshot collision');
  save('eligibility-snapshot-manifest.json',{...record,tickets:undefined,file:filename,file_sha256:sha(fs.readFileSync(file,'utf8')),final_frozen:false,blockers:['RULES_APPROVAL_REQUIRED',...(result.problems.length?['PAYMENT_RECONCILIATION_REQUIRED']:[])]});
  const special=[1,26,34,36].map(number=>{const t=d.raffle_tickets.find(t=>t.ticket_number===number);return {ticket_number:number,status:t.status,updated_at:t.updated_at,orders:d.raffle_orders.filter(o=>o.ticket_id===t.id).length,events:d.raffle_events.filter(e=>e.ticket_id===t.id).length,stripe_sessions:sessions.data.filter(s=>Number(s.metadata?.ticket_number)===number).length,stripe_intents:intents.data.filter(i=>Number(i.metadata?.ticket_number)===number).length};});
  const summary={captured_at:d.captured_at,sold:result.participants.filter(p=>p.status==='PAID').length,verified_paid:result.participants.filter(p=>p.payment_verified).length,stripe_assigned:result.participants.filter(p=>p.payment_method==='STRIPE'&&p.payment_verified).length,cash_assigned:result.participants.filter(p=>p.payment_method==='CASH').length,available:result.participants.filter(p=>p.status==='AVAILABLE').length,reserved:result.participants.filter(p=>p.status==='HELD').length,blocked:result.participants.filter(p=>p.status==='BLOCKED').length,eligible_provisional:candidate.length,eligible_final:null,recipient_count:result.recipients.length,unresolved_payments:result.problems.length,special,hashes,snapshot:filename,snapshot_sha256:record.sha256};
  save('reconciliation-summary.json',summary);return summary;
}
module.exports={canonical,sha,reconcile,writeReport};
if(require.main===module){try{console.log(JSON.stringify(writeReport(path.resolve(process.argv[2])),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
