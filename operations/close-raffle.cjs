/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS operation and tests. */
// Explicit production-only operation. Writes one raffle record, never its history.
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const EXPECTED = Object.freeze({ origin: 'https://rjopittanvizxrrtedko.supabase.co', slug: 'apple-watch-se-3-2026', id: '5336ec30-ac68-49f6-afa6-f194ba4ca0aa', winner: 34 });
const FIELDS = 'id,slug,status,draw_at,winner_ticket_number,winner_selected_at,draw_reference,updated_at';
class ClosureError extends Error {}
function check(ok, code) { if (!ok) throw new ClosureError(code); }
function canonical(v) { return Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v; }
function digest(rows) { return createHash('sha256').update(JSON.stringify(canonical(rows))).digest('hex'); }
function counts(rows) { return rows.reduce((a, r) => { const s = ['AVAILABLE','HELD','PAID','BLOCKED','PENDING','FAILED','CANCELLED'].includes(r.status) ? r.status : 'OTHER'; a[s] = (a[s] || 0) + 1; return a; }, {}); }
function guard(env, argv) {
  check(env.VERCEL_ENV === 'production', 'PRODUCTION_ONLY');
  check(argv.length === 1 && argv[0] === '--confirm-raffle-closure', 'EXPLICIT_CONFIRMATION_REQUIRED');
  check(env.NEXT_PUBLIC_SUPABASE_URL === EXPECTED.origin, 'PROJECT_URL_MISMATCH');
  check(typeof env.SUPABASE_SERVICE_ROLE_KEY === 'string' && env.SUPABASE_SERVICE_ROLE_KEY.length > 20, 'SERVICE_ROLE_REQUIRED');
}
async function closeRaffle({ env = process.env, argv = process.argv.slice(2), fetcher = fetch, now = () => new Date(), log = console.log } = {}) {
  guard(env, argv);
  const request = async (table, params, method = 'GET', body) => {
    const response = await fetcher(`${EXPECTED.origin}/rest/v1/${table}?${new URLSearchParams(params)}`, {
      method, headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000),
    });
    check(response.ok, `REST_${method}_${table}_${response.status}`);
    const rows = await response.json(); check(Array.isArray(rows), `INVALID_RESPONSE_${table}`); return rows;
  };
  const getRaffle = async () => {
    const rows = await request('raffles', { select: FIELDS, id: `eq.${EXPECTED.id}`, slug: `eq.${EXPECTED.slug}` });
    check(rows.length === 1, 'RAFFLE_NOT_UNIQUE'); const r = rows[0];
    check(r.id === EXPECTED.id && r.slug === EXPECTED.slug, 'RAFFLE_IDENTITY_MISMATCH');
    check(Number.isFinite(Date.parse(r.draw_at)) && Date.parse(r.draw_at) < now().getTime(), 'DRAW_NOT_PAST');
    check(r.winner_ticket_number === null || r.winner_ticket_number === EXPECTED.winner, 'CONFLICTING_WINNER');
    check(r.status === 'ACTIVE' || (r.status === 'DRAWN' && r.winner_ticket_number === EXPECTED.winner), 'CONFLICTING_STATUS');
    return r;
  };
  const snapshot = async () => {
    const result = {};
    for (const table of ['raffle_tickets','raffle_orders','raffle_events','public_raffle_ticket_states']) {
      const pub = table === 'public_raffle_ticket_states', rows = [];
      for (let offset = 0; ; ) {
        check(offset < 100000, 'SNAPSHOT_ROW_LIMIT');
        const page = await request(table, { select: '*', [pub ? 'raffle_slug' : 'raffle_id']: `eq.${pub ? EXPECTED.slug : EXPECTED.id}`, order: pub ? 'ticket_number.asc' : 'id.asc', limit: '500', offset: String(offset) });
        if (page.length === 0) break; rows.push(...page); offset += page.length;
      }
      if (table === 'raffle_tickets' || pub) check(rows.length === 50 && new Set(rows.map(r => r.ticket_number)).size === 50 && rows.every(r => Number.isInteger(r.ticket_number) && r.ticket_number >= 1 && r.ticket_number <= 50), `INVALID_50_TICKETS_${table}`);
      result[table] = { count: rows.length, sha256: digest(rows), ...(table !== 'raffle_events' ? { statuses: counts(rows) } : {}) };
    }
    return result;
  };
  const raffle = await getRaffle(), before = await snapshot();
  const sourceSha256 = createHash('sha256').update(readFileSync(__filename)).digest('hex');
  log(JSON.stringify({ operation: 'raffle_closure_preflight', sourceSha256, raffle: EXPECTED.slug, status: raffle.status, snapshots: before }));
  let changed = false;
  if (raffle.status === 'ACTIVE') {
    check(typeof raffle.updated_at === 'string', 'MISSING_CAS_TIMESTAMP');
    const rows = await request('raffles', { select: FIELDS, id: `eq.${EXPECTED.id}`, slug: `eq.${EXPECTED.slug}`, status: 'eq.ACTIVE', winner_ticket_number: raffle.winner_ticket_number === null ? 'is.null' : `eq.${EXPECTED.winner}`, updated_at: `eq.${raffle.updated_at}`, draw_at: `eq.${raffle.draw_at}` }, 'PATCH', {
      status: 'DRAWN', winner_ticket_number: EXPECTED.winner, winner_selected_at: now().toISOString(),
      draw_reference: 'Winner #34 announced by organizer for draw on 2026-10-25. winner_selected_at records this database registration, not the draw time.',
    });
    check(rows.length === 1 && rows[0].id === EXPECTED.id && rows[0].status === 'DRAWN' && rows[0].winner_ticket_number === EXPECTED.winner, 'CAS_UPDATE_NOT_CONFIRMED'); changed = true;
  }
  const final = await getRaffle(); check(final.status === 'DRAWN' && final.winner_ticket_number === EXPECTED.winner, 'FINAL_STATE_MISMATCH');
  const after = await snapshot(), unchanged = Object.keys(before).every(t => before[t].sha256 === after[t].sha256 && before[t].count === after[t].count);
  const report = { operation: 'raffle_closure_result', raffle: EXPECTED.slug, status: final.status, winner: EXPECTED.winner, changed, historyUnchanged: unchanged, snapshots: after };
  log(JSON.stringify(report)); check(unchanged, 'HISTORY_CHANGED_DURING_CLOSURE_REVIEW_REQUIRED'); return report;
}
module.exports = { closeRaffle, guard, digest, EXPECTED, ClosureError };
if (require.main === module) closeRaffle().catch(error => {
  // Raw fetch/database errors may contain secrets or customer data: never log them.
  console.error(JSON.stringify({ operation: 'raffle_closure_failed', code: error instanceof ClosureError ? error.message : 'UNEXPECTED_FAILURE_REVIEW_REQUIRED' })); process.exitCode = 1;
});
