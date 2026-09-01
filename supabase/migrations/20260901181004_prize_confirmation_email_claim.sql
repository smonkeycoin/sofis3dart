create or replace function public.claim_raffle_confirmation_email(
  order_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_order_id uuid := order_id;
  claimed_order_id uuid;
begin
  update public.raffle_orders as orders
  set confirmation_email_claimed_at = now()
  where orders.id = requested_order_id
    and orders.status = 'PAID'
    and orders.buyer_email is not null
    and orders.confirmation_email_sent_at is null
    and (
      orders.confirmation_email_claimed_at is null
      or orders.confirmation_email_claimed_at < now() - interval '15 minutes'
    )
  returning orders.id into claimed_order_id;

  return claimed_order_id is not null;
end;
$$;

revoke execute on function public.claim_raffle_confirmation_email(uuid) from public, anon, authenticated;
grant execute on function public.claim_raffle_confirmation_email(uuid) to service_role;
