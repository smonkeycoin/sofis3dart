create or replace function public.hold_raffle_ticket(
  raffle_slug text,
  ticket_number integer,
  hold_minutes integer default 10
)
returns table (
  reservation_id uuid,
  reserved_until timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_slug text := raffle_slug;
  requested_ticket_number integer := ticket_number;
  requested_hold_minutes integer := hold_minutes;
  target_raffle_id uuid;
  target_ticket public.raffle_tickets%rowtype;
  new_reservation_id uuid := gen_random_uuid();
  new_reserved_until timestamptz;
begin
  if requested_ticket_number is null or requested_ticket_number not between 1 and 50 then
    raise exception 'ticket_number must be between 1 and 50';
  end if;

  if requested_hold_minutes is null or requested_hold_minutes <= 0 or requested_hold_minutes > 60 then
    raise exception 'hold_minutes must be between 1 and 60';
  end if;

  perform public.release_expired_raffle_holds();

  select raffle.id
  into target_raffle_id
  from public.raffles as raffle
  where raffle.slug = requested_slug
    and raffle.status = 'ACTIVE';

  if target_raffle_id is null then
    raise exception 'active raffle not found for slug %', requested_slug;
  end if;

  select ticket.*
  into target_ticket
  from public.raffle_tickets as ticket
  where ticket.raffle_id = target_raffle_id
    and ticket.ticket_number = requested_ticket_number
  for update;

  if target_ticket.id is null then
    raise exception 'ticket % not found for raffle %', requested_ticket_number, requested_slug;
  end if;

  if target_ticket.status <> 'AVAILABLE' then
    raise exception 'ticket % is not available', requested_ticket_number;
  end if;

  new_reserved_until := now() + make_interval(mins => requested_hold_minutes);

  update public.raffle_tickets as ticket
  set
    status = 'HELD',
    reservation_id = new_reservation_id,
    reserved_until = new_reserved_until,
    updated_at = now()
  where ticket.id = target_ticket.id;

  insert into public.raffle_events (raffle_id, ticket_id, event_type, metadata)
  values (
    target_raffle_id,
    target_ticket.id,
    'TICKET_HELD',
    jsonb_build_object(
      'ticket_number', requested_ticket_number,
      'hold_minutes', requested_hold_minutes
    )
  );

  return query select new_reservation_id, new_reserved_until;
end;
$$;

create or replace function public.mark_raffle_ticket_paid(
  raffle_slug text,
  ticket_number integer,
  reservation_id uuid default null,
  amount integer default 34700,
  currency text default 'MXN',
  buyer_name text default null,
  buyer_email text default null,
  buyer_initials text default null,
  stripe_checkout_session_id text default null,
  stripe_payment_intent_id text default null
)
returns table (
  ticket_id uuid,
  order_id uuid,
  ticket_status text,
  paid_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_slug text := raffle_slug;
  requested_ticket_number integer := ticket_number;
  requested_reservation_id uuid := reservation_id;
  requested_amount integer := amount;
  requested_currency text := currency;
  requested_buyer_name text := buyer_name;
  requested_buyer_email text := buyer_email;
  requested_buyer_initials text := buyer_initials;
  requested_checkout_session_id text := stripe_checkout_session_id;
  requested_payment_intent_id text := stripe_payment_intent_id;
  target_raffle public.raffles%rowtype;
  target_ticket public.raffle_tickets%rowtype;
  existing_order public.raffle_orders%rowtype;
  paid_timestamp timestamptz := now();
  normalized_initials text;
begin
  if requested_ticket_number is null or requested_ticket_number not between 1 and 50 then
    raise exception 'ticket_number must be between 1 and 50';
  end if;

  perform public.release_expired_raffle_holds();

  select raffle.*
  into target_raffle
  from public.raffles as raffle
  where raffle.slug = requested_slug
    and raffle.status = 'ACTIVE';

  if target_raffle.id is null then
    raise exception 'active raffle not found for slug %', requested_slug;
  end if;

  if requested_amount is null or requested_amount <> target_raffle.ticket_price then
    raise exception 'payment amount % does not match raffle ticket price %', requested_amount, target_raffle.ticket_price;
  end if;

  if requested_currency is null or upper(requested_currency) <> target_raffle.currency then
    raise exception 'payment currency % does not match raffle currency %', requested_currency, target_raffle.currency;
  end if;

  if requested_checkout_session_id is null then
    raise exception 'stripe_checkout_session_id is required';
  end if;

  select ticket.*
  into target_ticket
  from public.raffle_tickets as ticket
  where ticket.raffle_id = target_raffle.id
    and ticket.ticket_number = requested_ticket_number
  for update;

  if target_ticket.id is null then
    raise exception 'ticket % not found for raffle %', requested_ticket_number, requested_slug;
  end if;

  select orders.*
  into existing_order
  from public.raffle_orders as orders
  where orders.stripe_checkout_session_id = requested_checkout_session_id
  limit 1;

  if target_ticket.status = 'PAID' then
    if target_ticket.stripe_checkout_session_id is distinct from requested_checkout_session_id then
      raise exception 'ticket % is already paid by a different checkout session', requested_ticket_number;
    end if;

    return query
    select target_ticket.id, existing_order.id, target_ticket.status, target_ticket.purchased_at;
    return;
  end if;

  if target_ticket.status <> 'HELD' then
    raise exception 'ticket % must be held before payment can be marked paid', requested_ticket_number;
  end if;

  if requested_reservation_id is null or target_ticket.reservation_id is distinct from requested_reservation_id then
    raise exception 'reservation_id does not match ticket hold';
  end if;

  normalized_initials := nullif(upper(left(regexp_replace(coalesce(requested_buyer_initials, ''), '[^[:alpha:]]', '', 'g'), 4)), '');

  insert into public.raffle_orders (
    raffle_id,
    ticket_id,
    amount,
    currency,
    status,
    buyer_name,
    buyer_email,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    paid_at
  )
  values (
    target_raffle.id,
    target_ticket.id,
    requested_amount,
    upper(requested_currency),
    'PAID',
    requested_buyer_name,
    requested_buyer_email,
    requested_checkout_session_id,
    requested_payment_intent_id,
    paid_timestamp
  )
  on conflict (stripe_checkout_session_id) do update
  set
    status = 'PAID',
    paid_at = coalesce(public.raffle_orders.paid_at, excluded.paid_at),
    stripe_payment_intent_id = coalesce(public.raffle_orders.stripe_payment_intent_id, excluded.stripe_payment_intent_id),
    buyer_name = coalesce(public.raffle_orders.buyer_name, excluded.buyer_name),
    buyer_email = coalesce(public.raffle_orders.buyer_email, excluded.buyer_email)
  returning * into existing_order;

  update public.raffle_tickets as ticket
  set
    status = 'PAID',
    reservation_id = null,
    reserved_until = null,
    buyer_initials = normalized_initials,
    purchased_at = paid_timestamp,
    stripe_checkout_session_id = requested_checkout_session_id,
    stripe_payment_intent_id = requested_payment_intent_id,
    updated_at = now()
  where ticket.id = target_ticket.id
  returning * into target_ticket;

  insert into public.raffle_events (raffle_id, ticket_id, event_type, metadata)
  values
    (
      target_raffle.id,
      target_ticket.id,
      'PAYMENT_SUCCEEDED',
      jsonb_build_object(
        'ticket_number', requested_ticket_number,
        'stripe_checkout_session_id', requested_checkout_session_id
      )
    ),
    (
      target_raffle.id,
      target_ticket.id,
      'TICKET_PAID',
      jsonb_build_object('ticket_number', requested_ticket_number)
    );

  return query
  select target_ticket.id, existing_order.id, target_ticket.status, target_ticket.purchased_at;
end;
$$;

drop function if exists public.get_public_raffle_tickets(text);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'raffles'
      and policyname = 'Public can read seeded raffle'
  ) then
    create policy "Public can read seeded raffle"
    on public.raffles
    for select
    to anon, authenticated
    using (slug = 'apple-watch-se-3-2026' and status = 'ACTIVE');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'raffle_tickets'
      and policyname = 'Public can read raffle ticket projection'
  ) then
    create policy "Public can read raffle ticket projection"
    on public.raffle_tickets
    for select
    to anon, authenticated
    using (
      exists (
        select 1
        from public.raffles as raffle
        where raffle.id = raffle_tickets.raffle_id
          and raffle.slug = 'apple-watch-se-3-2026'
          and raffle.status = 'ACTIVE'
      )
    );
  end if;
end;
$$;

create or replace view public.public_raffle_tickets
with (security_invoker = true, security_barrier = true)
as
select
  ticket.ticket_number,
  ticket.status,
  ticket.buyer_initials,
  ticket.purchased_at
from public.raffle_tickets as ticket
join public.raffles as raffle
  on raffle.id = ticket.raffle_id
where raffle.slug = 'apple-watch-se-3-2026'
  and raffle.status = 'ACTIVE'
order by ticket.ticket_number;

revoke all on table public.raffles from anon, authenticated;
revoke all on table public.raffle_tickets from anon, authenticated;
revoke all on table public.public_raffle_tickets from public;

grant select (id, slug, status) on table public.raffles to anon, authenticated;
grant select (raffle_id, ticket_number, status, buyer_initials, purchased_at) on table public.raffle_tickets to anon, authenticated;
grant select on table public.public_raffle_tickets to anon, authenticated, service_role;

revoke execute on function public.hold_raffle_ticket(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.mark_raffle_ticket_paid(text, integer, uuid, integer, text, text, text, text, text, text) from public, anon, authenticated;

grant execute on function public.hold_raffle_ticket(text, integer, integer) to service_role;
grant execute on function public.mark_raffle_ticket_paid(text, integer, uuid, integer, text, text, text, text, text, text) to service_role;
