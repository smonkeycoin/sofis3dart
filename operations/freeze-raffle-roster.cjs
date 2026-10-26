/* eslint-disable @typescript-eslint/no-require-imports */
// Creates local write-once evidence only. Never selects a winner or edits production.
const fs = require('node:fs');
const path = require('node:path');
const { sha } = require('./reconcile-raffle.cjs');
function validateFreeze({ approval, evidence, snapshot, now = Date.now() }) {
  if (approval.rules_approved !== true || !approval.approved_by || !approval.approved_at || !approval.rules_version || !approval.approval_reference) throw Error('RULES_APPROVAL_REQUIRED');
  if (approval.reconciliation_resolved !== true || !approval.resolution_reference || approval.blockers?.length !== 0) throw Error('RECONCILIATION_NOT_RESOLVED');
  const age = now - Date.parse(evidence.captured_at);
  if (!Number.isFinite(age) || age < 0 || age > 300000) throw Error('FRESH_PRODUCTION_AUDIT_REQUIRED');
  if (approval.snapshot_sha256 !== snapshot.sha256 || sha(snapshot.tickets) !== snapshot.sha256) throw Error('ROSTER_HASH_MISMATCH');
  for (const table of ['raffle_tickets','raffle_orders','raffle_events']) {
    if (sha(evidence[table]) !== approval.source_sha256?.[table] || sha(evidence[table]) !== snapshot.source_sha256[table]) throw Error('SOURCE_CHANGED_REVIEW_NO_UPDATE');
  }
  if (!snapshot.tickets.length || new Set(snapshot.tickets.map(t=>t.ticket_number)).size !== snapshot.tickets.length) throw Error('INVALID_ROSTER');
  for (const t of snapshot.tickets) {
    if (t.status !== 'PAID_PENDING_RULES_APPROVAL' || !evidence.raffle_tickets.some(row=>String(row.ticket_number).padStart(2,'0')===t.ticket_number&&row.status==='PAID')) throw Error('UNPAID_TICKET');
  }
}
function freeze(dir, approvalFile) {
  const read = file => JSON.parse(fs.readFileSync(file,'utf8'));
  const approval = read(approvalFile), evidence = read(path.join(dir,'supabase-current-private.json'));
  const index = read(path.join(dir,'eligibility-snapshot-manifest.json'));
  if (path.basename(index.file) !== index.file) throw Error('INVALID_SNAPSHOT_PATH');
  const snapshot = read(path.join(dir,index.file));
  validateFreeze({approval,evidence,snapshot});
  const final = path.join(dir,'final-roster');
  fs.mkdirSync(final,{mode:0o700}); // EEXIST blocks all attempts to replace a frozen roster.
  const roster = snapshot.tickets.map(t=>({ticket_number:t.ticket_number,status:'ELIGIBLE'}));
  const manifest={version:1,frozen_at:new Date().toISOString(),draw_at:'2026-11-02T00:00:00.000Z',timezone:'America/Cancun',rules_version:approval.rules_version,approval_reference:approval.approval_reference,sha256:sha(roster),source_sha256:snapshot.source_sha256,total:roster.length};
  for(const [name,data] of [['roster-public.json',roster],['manifest.json',manifest]]) fs.writeFileSync(path.join(final,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o400});
  fs.chmodSync(final,0o500);
  return manifest;
}
module.exports={validateFreeze,freeze};
if(require.main===module){try{if(process.argv.length!==4)throw Error('Usage: freeze-raffle-roster.cjs EVIDENCE_DIR APPROVAL_JSON');console.log(JSON.stringify(freeze(path.resolve(process.argv[2]),path.resolve(process.argv[3])),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
