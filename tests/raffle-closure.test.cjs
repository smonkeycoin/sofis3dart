/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS operation and tests. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { closeRaffle, EXPECTED } = require('../operations/close-raffle.cjs');
const env = { VERCEL_ENV: 'production', NEXT_PUBLIC_SUPABASE_URL: EXPECTED.origin, SUPABASE_SERVICE_ROLE_KEY: 'test-secret-never-print-this-value' };
const argv = ['--confirm-raffle-closure'];
function fixture(options = {}) {
  const raffle = { id: EXPECTED.id, slug: EXPECTED.slug, status: 'ACTIVE', draw_at: '2026-10-26T01:00:00Z', winner_ticket_number: null, winner_selected_at: null, updated_at: '2026-10-13T15:00:00Z', ...options.raffle };
  const tickets = Array.from({length:50},(_,i)=>({id:String(i+1).padStart(2,'0'),raffle_id:EXPECTED.id,ticket_number:i+1,status:i===33?'AVAILABLE':'PAID'}));
  const records = {raffle_tickets:tickets,raffle_orders:[{id:'o',raffle_id:EXPECTED.id,status:'PAID',buyer_email:'private@example.test'}],raffle_events:[{id:'e',raffle_id:EXPECTED.id,metadata:{buyer_name:'Private Person'}}],public_raffle_ticket_states:tickets.map(t=>({raffle_slug:EXPECTED.slug,ticket_number:t.ticket_number,status:t.status}))};
  const writes=[], logs=[]; let calls=0;
  const fetcher = async (url, init) => {
    calls++; const u=new URL(url), table=u.pathname.split('/').pop();
    assert.equal(u.origin, EXPECTED.origin);
    if(init.method==='PATCH') {
      writes.push({table,params:u.searchParams,body:JSON.parse(init.body)});
      if(options.casFail)return Response.json([]);
      Object.assign(raffle,JSON.parse(init.body));
      if(options.historyChange)records.raffle_orders[0].status='CANCELLED';
      return Response.json([raffle]);
    }
    assert.equal(init.method,'GET');
    if(table==='raffles')return Response.json([raffle]);
    const offset=Number(u.searchParams.get('offset'));
    return Response.json(records[table].slice(offset,offset+(options.pageSize||500)));
  };
  return {writes,logs,records,raffle,get calls(){return calls;},run:(overrides={})=>closeRaffle({env,argv,fetcher,now:()=>new Date('2026-10-26T05:00:00Z'),log:s=>logs.push(s),...overrides})};
}
test('guards fail before network or writes', async()=>{
  for(const override of [{env:{...env,VERCEL_ENV:'preview'}},{argv:[]},{env:{...env,NEXT_PUBLIC_SUPABASE_URL:'https://other.supabase.co'}},{env:{...env,SUPABASE_SERVICE_ROLE_KEY:''}}]){
    const f=fixture(); await assert.rejects(f.run(override)); assert.equal(f.calls,0);
  }
});
test('closes only raffle by CAS; preserves all history; logs no PII or secrets; handles capped pages',async()=>{
  const f=fixture({pageSize:7}), before=JSON.stringify(f.records); const result=await f.run();
  assert.equal(result.historyUnchanged,true);assert.equal(JSON.stringify(f.records),before);assert.equal(f.writes.length,1);
  const w=f.writes[0];assert.equal(w.table,'raffles');assert.equal(w.params.get('status'),'eq.ACTIVE');assert.equal(w.params.get('winner_ticket_number'),'is.null');assert.equal(w.params.get('id'),'eq.'+EXPECTED.id);assert.match(w.params.get('updated_at'),/^eq\./);
  assert.deepEqual(Object.keys(w.body).sort(),['draw_reference','status','winner_selected_at','winner_ticket_number']);assert.equal(w.body.winner_selected_at,'2026-10-26T05:00:00.000Z');
  assert.doesNotMatch(f.logs.join(''),/private@example|Private Person|test-secret/);
});
test('already DRAWN winner34 is idempotent with zero writes',async()=>{
  const f=fixture({raffle:{status:'DRAWN',winner_ticket_number:34}});assert.equal((await f.run()).changed,false);assert.equal(f.writes.length,0);
});
test('conflicting winner, future draw, wrong identity and missing ticket reject without writes',async()=>{
  for(const raffle of [{winner_ticket_number:12},{draw_at:'2099-01-01'},{id:'wrong'},{status:'CANCELLED'}]){const f=fixture({raffle});await assert.rejects(f.run());assert.equal(f.writes.length,0);}
  const f=fixture();f.records.raffle_tickets.pop();await assert.rejects(f.run(),/INVALID_50_TICKETS/);assert.equal(f.writes.length,0);
});
test('concurrent raffle modification refuses CAS success',async()=>{const f=fixture({casFail:true});await assert.rejects(f.run(),/CAS_UPDATE_NOT_CONFIRMED/);});
test('concurrent history change fails verification and reports it without reverting history',async()=>{const f=fixture({historyChange:true});await assert.rejects(f.run(),/HISTORY_CHANGED/);assert.match(f.logs.at(-1),/"historyUnchanged":false/);assert.equal(f.writes.length,1);});
