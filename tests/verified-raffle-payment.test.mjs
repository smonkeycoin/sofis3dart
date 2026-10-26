import test from 'node:test';
import assert from 'node:assert/strict';
import { isVerifiedHistoricalPayment } from '../lib/verified-raffle-payment.ts';
function fixture(){return {
  order:{id:'o',raffle_id:'r',ticket_id:'t',status:'PAID',reservation_id:'res',stripe_checkout_session_id:'cs',stripe_payment_intent_id:'pi',amount:34700,currency:'MXN'},
  ticket:{id:'t',raffle_id:'r',ticket_number:34,status:'PAID',stripe_checkout_session_id:'cs',stripe_payment_intent_id:'pi'},
  raffle:{id:'r',slug:'apple-watch-se-3-2026',status:'DRAWN'},
  expected:{orderId:'o',reservationId:'res',sessionId:'cs',paymentIntentId:'pi',ticketNumber:34,amount:34700,currency:'MXN',raffleSlug:'apple-watch-se-3-2026'},
};}
test('acknowledges exact recorded payment of closed raffle',()=>assert.equal(isVerifiedHistoricalPayment(fixture()),true));
test('every identity, status, amount, currency or payment mismatch denies short-circuit',()=>{
  for(const section of ['order','ticket','raffle','expected'])for(const key of Object.keys(fixture()[section])){
    const f=fixture();f[section][key]=typeof f[section][key]==='number'?-1:'mismatch';assert.equal(isVerifiedHistoricalPayment(f),false,section+'.'+key);
  }
  for(const section of ['order','ticket','raffle']){const f=fixture();f[section]=null;assert.equal(isVerifiedHistoricalPayment(f),false);}
  const f=fixture();f.expected.paymentIntentId=null;assert.equal(isVerifiedHistoricalPayment(f),false);
});
