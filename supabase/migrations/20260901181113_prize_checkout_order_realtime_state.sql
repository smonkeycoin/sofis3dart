alter table public.raffle_orders
  add column if not exists reservation_id uuid null,
  add column if not exists confirmation_email_claimed_at timestamptz null;

create index if not exists raffle_orders_reservation_id_idx
  on public.raffle_orders (reservation_id)
  where reservation_id is not null;

alter table public.raffle_events
  drop constraint if exists raffle_events_event_type_check;

alter table public.raffle_events
  add constraint raffle_events_event_type_check
  check (
    event_type in (
      'TICKET_HELD',
      'HOLD_EXPIRED',
      'CHECKOUT_CREATED',
      'CHECKOUT_EXPIRED',
      'PAYMENT_SUCCEEDED',
      'PAYMENT_FAILED',
      'TICKET_PAID',
      'CONFIRMATION_EMAIL_SENT',
      'CONFIRMATION_EMAIL_FAILED',
      'ADMIN_BLOCKED',
      'ADMIN_RELEASED'
    )
  );

create table if not exists public.public_raffle_ticket_states (
  raffle_slug text not null,
  ticket_number integer not null check (ticket_number between 1 and 50),
  status text not null check (status in ('AVAILABLE', 'HELD', 'PAID', 'BLOCKED')),
  buyer_initials text null,
  purchased_at timestamptz null,
  updated_at timestamptz not null default now(),
  primary key (raffle_slug, ticket_number)
);

alter table public.public_raffle_ticket_states enable row level security;
revoke all on table public.public_raffle_ticket_states from public, anon, authenticated;
grant select on table public.public_raffle_ticket_states to anon, authenticated, service_role;
grant all on table public.public_raffle_ticket_states to service_role;

drop policy if exists "Public can read safe raffle ticket state"
on public.public_raffle_ticket_states;

create policy "Public can read safe raffle ticket state"
on public.public_raffle_ticket_states
for select
to anon, authenticated
using (raffle_slug = 'apple-watch-se-3-2026');

create or replace function public.sync_public_raffle_ticket_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_slug text;
begin
  select raffle.slug
  into target_slug
  from public.raffles as raffle
  where raffle.id = new.raffle_id;

  if target_slug is null then
    return new;
  end if;

  insert into public.public_raffle_ticket_states (
    raffle_slug,
    ticket_number,
    status,
    buyer_initials,
    purchased_at,
    updated_at
  )
  values (
    target_slug,
    new.ticket_number,
    new.status,
    new.buyer_initials,
    new.purchased_at,
    now()
  )
  on conflict (raffle_slug, ticket_number) do update
  set
    status = excluded.status,
    buyer_initials = excluded.buyer_initials,
    purchased_at = excluded.purchased_at,
    updated_at = excluded.updated_at;

  return new;
end;
$$;

drop trigger if exists sync_public_raffle_ticket_state_after_write
on public.raffle_tickets;

create trigger sync_public_raffle_ticket_state_after_write
after insert or update of status, buyer_initials, purchased_at on public.raffle_tickets
for each row execute function public.sync_public_raffle_ticket_state();

insert into public.public_raffle_ticket_states (
  raffle_slug,
  ticket_number,
  status,
  buyer_initials,
  purchased_at
)
select
  raffle.slug,
  ticket.ticket_number,
  ticket.status,
  ticket.buyer_initials,
  ticket.purchased_at
from public.raffle_tickets as ticket
join public.raffles as raffle
  on raffle.id = ticket.raffle_id
where raffle.slug = 'apple-watch-se-3-2026'
on conflict (raffle_slug, ticket_number) do update
set
  status = excluded.status,
  buyer_initials = excluded.buyer_initials,
  purchased_at = excluded.purchased_at,
  updated_at = now();

do $$
begin
  alter publication supabase_realtime add table public.public_raffle_ticket_states;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

create or replace view public.public_raffle_tickets
with (security_invoker = true, security_barrier = true)
as
select
  state.ticket_number,
  state.status,
  state.buyer_initials,
  state.purchased_at
from public.public_raffle_ticket_states as state
where state.raffle_slug = 'apple-watch-se-3-2026'
order by state.ticket_number;

grant select on table public.public_raffle_tickets to anon, authenticated, service_role;

create or replace function public.create_raffle_checkout_order(
  raffle_slug text,
  ticket_number integer,
  reservation_id uuid
)
returns table (
  order_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_slug text := raffle_slug;
  requested_ticket_number integer := ticket_number;
  requested_reservation_id uuid := reservation_id;
  target_raffle public.raffles%rowtype;
  target_ticket public.raffle_tickets%rowtype;
  new_order_id uuid;
begin
  perform public.release_expired_raffle_holds();

  if requested_ticket_number is null or requested_ticket_number not between 1 and 50 then
    raise exception 'ticket_number must be between 1 and 50';
  end if;

  if requested_reservation_id is null then
    raise exception 'reservation_id is required';
  end if;

  select raffle.*
  into target_raffle
  from public.raffles as raffle
  where raffle.slug = requested_slug
    and raffle.status = 'ACTIVE';

  if target_raffle.id is null then
    raise exception 'active raffle not found for slug %', requested_slug;
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

  if target_ticket.status <> 'HELD'
    or target_ticket.reservation_id is distinct from requested_reservation_id
    or target_ticket.reserved_until <= now() then
    raise exception 'ticket hold is not active';
  end if;

  insert into public.raffle_orders (
    raffle_id,
    ticket_id,
    amount,
    currency,
    status,
    reservation_id
  )
  values (
    target_raffle.id,
    target_ticket.id,
    target_raffle.ticket_price,
    target_raffle.currency,
    'PENDING',
    requested_reservation_id
  )
  returning id into new_order_id;

  return query select new_order_id;
end;
$$;

create or replace function public.record_raffle_checkout_created(
  order_id uuid,
  stripe_checkout_session_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_order_id uuid := order_id;
  requested_checkout_session_id text := stripe_checkout_session_id;
  target_order public.raffle_orders%rowtype;
  target_ticket public.raffle_tickets%rowtype;
begin
  if requested_order_id is null then
    raise exception 'order_id is required';
  end if;

  if requested_checkout_session_id is null then
    raise exception 'stripe_checkout_session_id is required';
  end if;

  select orders.*
  into target_order
  from public.raffle_orders as orders
  where orders.id = requested_order_id
  for update;

  if target_order.id is null then
    raise exception 'order % not found', requested_order_id;
  end if;

  if target_order.stripe_checkout_session_id is not null
    and target_order.stripe_checkout_session_id <> requested_checkout_session_id then
    raise exception 'order already has a different checkout session';
  end if;

  select ticket.*
  into target_ticket
  from public.raffle_tickets as ticket
  where ticket.id = target_order.ticket_id
  for update;

  update public.raffle_orders as orders
  set stripe_checkout_session_id = requested_checkout_session_id
  where orders.id = target_order.id;

  update public.raffle_tickets as ticket
  set
    stripe_checkout_session_id = requested_checkout_session_id,
    updated_at = now()
  where ticket.id = target_order.ticket_id
    and ticket.status = 'HELD';

  if not exists (
    select 1
    from public.raffle_events as event
    where event.event_type = 'CHECKOUT_CREATED'
      and event.metadata ->> 'stripe_checkout_session_id' = requested_checkout_session_id
  ) then
    insert into public.raffle_events (raffle_id, ticket_id, event_type, metadata)
    values (
      target_order.raffle_id,
      target_order.ticket_id,
      'CHECKOUT_CREATED',
      jsonb_build_object(
        'order_id', target_order.id,
        'ticket_number', target_ticket.ticket_number,
        'stripe_checkout_session_id', requested_checkout_session_id
      )
    );
  end if;
end;
$$;

create or replace function public.expire_raffle_checkout_session(
  stripe_checkout_session_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_checkout_session_id text := stripe_checkout_session_id;
  target_order public.raffle_orders%rowtype;
  target_ticket public.raffle_tickets%rowtype;
begin
  if requested_checkout_session_id is null then
    raise exception 'stripe_checkout_session_id is required';
  end if;

  select orders.*
  into target_order
  from public.raffle_orders as orders
  where orders.stripe_checkout_session_id = requested_checkout_session_id
  for update;

  if target_order.id is null or target_order.status = 'PAID' then
    return;
  end if;

  select ticket.*
  into target_ticket
  from public.raffle_tickets as ticket
  where ticket.id = target_order.ticket_id
  for update;

  update public.raffle_orders as orders
  set status = 'CANCELLED'
  where orders.id = target_order.id
    and orders.status = 'PENDING';

  if target_ticket.status = 'HELD'
    and target_ticket.reservation_id is not distinct from target_order.reservation_id then
    update public.raffle_tickets as ticket
    set
      status = 'AVAILABLE',
      reservation_id = null,
      reserved_until = null,
      stripe_checkout_session_id = null,
      updated_at = now()
    where ticket.id = target_ticket.id;

    insert into public.raffle_events (raffle_id, ticket_id, event_type, metadata)
    values (
      target_order.raffle_id,
      target_order.ticket_id,
      'HOLD_EXPIRED',
      jsonb_build_object(
        'order_id', target_order.id,
        'ticket_number', target_ticket.ticket_number,
        'stripe_checkout_session_id', requested_checkout_session_id
      )
    );
  end if;

  if not exists (
    select 1
    from public.raffle_events as event
    where event.event_type = 'CHECKOUT_EXPIRED'
      and event.metadata ->> 'stripe_checkout_session_id' = requested_checkout_session_id
  ) then
    insert into public.raffle_events (raffle_id, ticket_id, event_type, metadata)
    values (
      target_order.raffle_id,
      target_order.ticket_id,
      'CHECKOUT_EXPIRED',
      jsonb_build_object(
        'order_id', target_order.id,
        'ticket_number', target_ticket.ticket_number,
        'stripe_checkout_session_id', requested_checkout_session_id
      )
    );
  end if;
end;
$$;

drop function if exists public.mark_raffle_ticket_paid(text, integer, uuid, integer, text, text, text, text, text, text);

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
  stripe_payment_intent_id text default null,
  target_order_id uuid default null
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
  requested_order_id uuid := target_order_id;
  target_raffle public.raffles%rowtype;
  target_ticket public.raffle_tickets%rowtype;
  target_order public.raffle_orders%rowtype;
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

  if requested_order_id is not null then
    select orders.*
    into target_order
    from public.raffle_orders as orders
    where orders.id = requested_order_id
    for update;

    if target_order.id is null then
      raise exception 'order % not found', requested_order_id;
    end if;
  else
    select orders.*
    into target_order
    from public.raffle_orders as orders
    where orders.stripe_checkout_session_id = requested_checkout_session_id
    limit 1
    for update;
  end if;

  if target_order.id is not null then
    if target_order.raffle_id <> target_raffle.id or target_order.ticket_id <> target_ticket.id then
      raise exception 'order does not belong to requested raffle ticket';
    end if;

    if target_order.stripe_checkout_session_id is not null
      and target_order.stripe_checkout_session_id <> requested_checkout_session_id then
      raise exception 'order already has a different checkout session';
    end if;
  end if;

  if target_ticket.status = 'PAID' then
    if target_ticket.stripe_checkout_session_id is distinct from requested_checkout_session_id then
      raise exception 'ticket % is already paid by a different checkout session', requested_ticket_number;
    end if;

    if target_order.id is not null and target_order.status <> 'PAID' then
      update public.raffle_orders as orders
      set
        status = 'PAID',
        paid_at = coalesce(orders.paid_at, target_ticket.purchased_at, paid_timestamp),
        buyer_name = coalesce(orders.buyer_name, requested_buyer_name),
        buyer_email = coalesce(orders.buyer_email, requested_buyer_email),
        stripe_payment_intent_id = coalesce(orders.stripe_payment_intent_id, requested_payment_intent_id),
        stripe_checkout_session_id = coalesce(orders.stripe_checkout_session_id, requested_checkout_session_id)
      where orders.id = target_order.id
      returning * into target_order;
    end if;

    return query
    select target_ticket.id, target_order.id, target_ticket.status, target_ticket.purchased_at;
    return;
  end if;

  if target_ticket.status <> 'HELD' then
    raise exception 'ticket % must be held before payment can be marked paid', requested_ticket_number;
  end if;

  if requested_reservation_id is null or target_ticket.reservation_id is distinct from requested_reservation_id then
    raise exception 'reservation_id does not match ticket hold';
  end if;

  if target_order.id is not null
    and target_order.reservation_id is not null
    and target_order.reservation_id is distinct from requested_reservation_id then
    raise exception 'order reservation_id does not match ticket hold';
  end if;

  normalized_initials := nullif(upper(left(regexp_replace(coalesce(requested_buyer_initials, ''), '[^[:alpha:]]', '', 'g'), 4)), '');

  if target_order.id is null then
    insert into public.raffle_orders (
      raffle_id,
      ticket_id,
      amount,
      currency,
      status,
      buyer_name,
      buyer_email,
      reservation_id,
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
      requested_reservation_id,
      requested_checkout_session_id,
      requested_payment_intent_id,
      paid_timestamp
    )
    on conflict on constraint raffle_orders_stripe_checkout_session_id_key do update
    set
      status = 'PAID',
      paid_at = coalesce(public.raffle_orders.paid_at, excluded.paid_at),
      stripe_payment_intent_id = coalesce(public.raffle_orders.stripe_payment_intent_id, excluded.stripe_payment_intent_id),
      buyer_name = coalesce(public.raffle_orders.buyer_name, excluded.buyer_name),
      buyer_email = coalesce(public.raffle_orders.buyer_email, excluded.buyer_email)
    returning * into target_order;
  else
    update public.raffle_orders as orders
    set
      amount = requested_amount,
      currency = upper(requested_currency),
      status = 'PAID',
      buyer_name = coalesce(orders.buyer_name, requested_buyer_name),
      buyer_email = coalesce(orders.buyer_email, requested_buyer_email),
      reservation_id = coalesce(orders.reservation_id, requested_reservation_id),
      stripe_checkout_session_id = coalesce(orders.stripe_checkout_session_id, requested_checkout_session_id),
      stripe_payment_intent_id = coalesce(orders.stripe_payment_intent_id, requested_payment_intent_id),
      paid_at = coalesce(orders.paid_at, paid_timestamp)
    where orders.id = target_order.id
    returning * into target_order;
  end if;

  update public.raffle_tickets as ticket
  set
    status = 'PAID',
    reservation_id = null,
    reserved_until = null,
    buyer_initials = normalized_initials,
    purchased_at = coalesce(target_order.paid_at, paid_timestamp),
    stripe_checkout_session_id = requested_checkout_session_id,
    stripe_payment_intent_id = requested_payment_intent_id,
    updated_at = now()
  where ticket.id = target_ticket.id
  returning * into target_ticket;

  if not exists (
    select 1
    from public.raffle_events as event
    where event.event_type = 'PAYMENT_SUCCEEDED'
      and event.metadata ->> 'stripe_checkout_session_id' = requested_checkout_session_id
  ) then
    insert into public.raffle_events (raffle_id, ticket_id, event_type, metadata)
    values (
      target_raffle.id,
      target_ticket.id,
      'PAYMENT_SUCCEEDED',
      jsonb_build_object(
        'order_id', target_order.id,
        'ticket_number', requested_ticket_number,
        'stripe_checkout_session_id', requested_checkout_session_id
      )
    );
  end if;

  if not exists (
    select 1
    from public.raffle_events as event
    where event.event_type = 'TICKET_PAID'
      and event.ticket_id = target_ticket.id
  ) then
    insert into public.raffle_events (raffle_id, ticket_id, event_type, metadata)
    values (
      target_raffle.id,
      target_ticket.id,
      'TICKET_PAID',
      jsonb_build_object(
        'order_id', target_order.id,
        'ticket_number', requested_ticket_number
      )
    );
  end if;

  return query
  select target_ticket.id, target_order.id, target_ticket.status, target_ticket.purchased_at;
end;
$$;

create or replace function public.record_raffle_payment_failed(
  stripe_checkout_session_id text default null,
  stripe_payment_intent_id text default null,
  failure_message text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_checkout_session_id text := stripe_checkout_session_id;
  requested_payment_intent_id text := stripe_payment_intent_id;
  target_order public.raffle_orders%rowtype;
begin
  select orders.*
  into target_order
  from public.raffle_orders as orders
  where (
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
      'failure_message', failure_message
    )
  );
end;
$$;

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

revoke execute on function public.sync_public_raffle_ticket_state() from public, anon, authenticated;
revoke execute on function public.create_raffle_checkout_order(text, integer, uuid) from public, anon, authenticated;
revoke execute on function public.record_raffle_checkout_created(uuid, text) from public, anon, authenticated;
revoke execute on function public.expire_raffle_checkout_session(text) from public, anon, authenticated;
revoke execute on function public.mark_raffle_ticket_paid(text, integer, uuid, integer, text, text, text, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.record_raffle_payment_failed(text, text, text) from public, anon, authenticated;
revoke execute on function public.claim_raffle_confirmation_email(uuid) from public, anon, authenticated;

grant execute on function public.create_raffle_checkout_order(text, integer, uuid) to service_role;
grant execute on function public.record_raffle_checkout_created(uuid, text) to service_role;
grant execute on function public.expire_raffle_checkout_session(text) to service_role;
grant execute on function public.mark_raffle_ticket_paid(text, integer, uuid, integer, text, text, text, text, text, text, uuid) to service_role;
grant execute on function public.record_raffle_payment_failed(text, text, text) to service_role;
grant execute on function public.claim_raffle_confirmation_email(uuid) to service_role;
