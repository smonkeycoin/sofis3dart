create or replace function public.record_raffle_payment_failed(
  stripe_checkout_session_id text default null,
  stripe_payment_intent_id text default null,
  failure_message text default null,
  target_order_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_checkout_session_id text := stripe_checkout_session_id;
  requested_payment_intent_id text := stripe_payment_intent_id;
  requested_failure_message text := failure_message;
  requested_order_id uuid := target_order_id;
  target_order public.raffle_orders%rowtype;
begin
  select orders.*
  into target_order
  from public.raffle_orders as orders
  where (
      requested_order_id is not null
      and orders.id = requested_order_id
    )
    or (
      requested_checkout_session_id is not null
      and orders.stripe_checkout_session_id = requested_checkout_session_id
    )
    or (
      requested_payment_intent_id is not null
      and orders.stripe_payment_intent_id = requested_payment_intent_id
    )
  limit 1
  for update;

  if target_order.id is null then
    return;
  end if;

  if target_order.status <> 'PAID' then
    update public.raffle_orders as orders
    set
      status = 'FAILED',
      stripe_payment_intent_id = coalesce(orders.stripe_payment_intent_id, requested_payment_intent_id)
    where orders.id = target_order.id;
  end if;

  insert into public.raffle_events (raffle_id, ticket_id, event_type, metadata)
  values (
    target_order.raffle_id,
    target_order.ticket_id,
    'PAYMENT_FAILED',
    jsonb_build_object(
      'order_id', target_order.id,
      'stripe_checkout_session_id', requested_checkout_session_id,
      'stripe_payment_intent_id', requested_payment_intent_id,
      'failure_message', requested_failure_message
    )
  );
end;
$$;

revoke execute on function public.record_raffle_payment_failed(text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.record_raffle_payment_failed(text, text, text, uuid) to service_role;
