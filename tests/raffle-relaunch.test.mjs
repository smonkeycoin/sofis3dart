import test from 'node:test';
import assert from 'node:assert/strict';
import { publicTicketStates } from '../lib/public-raffle-state.ts';
import { prizeRaffle, buildGoogleCalendarUrl, buildIcsHref } from '../lib/prize.ts';
import freezeModule from '../operations/freeze-raffle-roster.cjs';
import auditModule from '../operations/reconcile-raffle.cjs';
import loadSource from '../scripts/load-source.cjs';
const {validateFreeze}=freezeModule;
const {sha}=auditModule;
test('public projection cannot leak private fields and fails closed on missing, duplicate or invalid tickets',()=>{
  const rows=Array.from({length:50},(_,i)=>({ticket_number:i+1,status:'PAID',buyer_name:'PRIVATE',buyer_email:'PRIVATE',payment_reference:'PRIVATE'}));
  const safe=publicTicketStates(rows);assert.equal(safe.length,50);assert.deepEqual(Object.keys(safe[0]),['ticket_number','status']);
  for(const invalid of [null,[],rows.slice(1),[...rows.slice(1),rows[1]],rows.map((r,i)=>i? r:{...r,status:'UNKNOWN'}),rows.map((r,i)=>i?r:{...r,ticket_number:0})])assert.equal(publicTicketStates(invalid),null);
});
test('Cancun date, countdown target, Google Calendar and ICS agree on Sunday November 1 at 19:00',()=>{
  assert.equal(prizeRaffle.drawAtIso,'2026-11-02T00:00:00.000Z');
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Cancun',weekday:'long',hour:'2-digit',hour12:false}).formatToParts(new Date(prizeRaffle.drawAtIso));
  assert.equal(parts.find(p=>p.type==='weekday').value,'Sunday');
  assert.equal(parts.find(p=>p.type==='hour').value,'19');
  assert.equal(new URL(buildGoogleCalendarUrl()).searchParams.get('dates'),'20261102T000000Z/20261102T010000Z');
  assert.match(decodeURIComponent(buildIcsHref()),/DTSTART:20261102T000000Z/);
});
function valid(){const evidence={captured_at:new Date().toISOString(),raffle_tickets:[{ticket_number:1,status:'PAID'}],raffle_orders:[],raffle_events:[]};const source_sha256=Object.fromEntries(['raffle_tickets','raffle_orders','raffle_events'].map(k=>[k,sha(evidence[k])]));const tickets=[{ticket_number:'01',status:'PAID_PENDING_RULES_APPROVAL'}];const snapshot={source_sha256,tickets,sha256:sha(tickets)};const approval={rules_approved:true,approved_by:'test',approved_at:evidence.captured_at,rules_version:'test-v1',approval_reference:'TEST ONLY',reconciliation_resolved:true,resolution_reference:'TEST ONLY',blockers:[],snapshot_sha256:snapshot.sha256,source_sha256};return {approval,evidence,snapshot};}
test('freeze blocks missing approval, unresolved reconciliation, stale data, hash tampering and unpaid tickets',()=>{
  assert.doesNotThrow(()=>validateFreeze(valid()));
  let f=valid();f.approval.rules_approved=false;assert.throws(()=>validateFreeze(f),/RULES_APPROVAL/);
  f=valid();f.approval.blockers=['unresolved'];assert.throws(()=>validateFreeze(f),/NOT_RESOLVED/);
  f=valid();f.evidence.captured_at='2020-01-01T00:00:00Z';assert.throws(()=>validateFreeze(f),/FRESH/);
  f=valid();f.snapshot.tickets[0].ticket_number='34';assert.throws(()=>validateFreeze(f),/HASH/);
  f=valid();f.evidence.raffle_tickets[0].status='AVAILABLE';assert.throws(()=>validateFreeze(f),/SOURCE_CHANGED/);
});

test('ticket API strips extra data, never caches, fails closed; checkout remains closed',async()=>{
  const originalFetch=globalThis.fetch;
  const originalUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const {GET}=loadSource('app/api/prize/tickets/route.ts');
  const {POST}=loadSource('app/api/prize/checkout/route.ts');
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.invalid';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='TEST_ONLY';
    globalThis.fetch=async()=>Response.json(Array.from({length:50},(_,i)=>({ticket_number:i+1,status:i===33?'AVAILABLE':'PAID',buyer_email:'PRIVATE'})));
    let response=await GET();assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.ok(!(await response.text()).includes('PRIVATE'));
    globalThis.fetch=async()=>Response.json([]);response=await GET();assert.equal(response.status,503);
    globalThis.fetch=async()=>{throw Error('PRIVATE PROVIDER ERROR')};response=await GET();assert.equal(response.status,503);assert.ok(!(await response.text()).includes('PRIVATE'));
    assert.equal((await POST()).status,410);
  } finally {
    globalThis.fetch=originalFetch;
    if(originalUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=originalUrl;
    if(originalKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=originalKey;
  }
});
