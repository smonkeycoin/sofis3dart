create extension if not exists pgcrypto with schema extensions;

create table public.raffles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  prize_name text not null,
  ticket_price integer not null check (ticket_price > 0),
  currency text not null check (currency = upper(currency)),
  total_tickets integer not null check (total_tickets = 50),
  draw_at timestamptz not null,
  timezone text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'DRAWN', 'CANCELLED')),
  winner_ticket_number integer null check (
    winner_ticket_number is null
    or winner_ticket_number between 1 and 50
  ),
  winner_selected_at timestamptz null,
  draw_platform text null,
  draw_reference text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.raffle_tickets (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  ticket_number integer not null check (ticket_number between 1 and 50),
  status text not null default 'AVAILABLE' check (status in ('AVAILABLE', 'HELD', 'PAID', 'BLOCKED')),
  reservation_id uuid null,
  reserved_until timestamptz null,
  buyer_initials text null,
  purchased_at timestamptz null,
  stripe_checkout_session_id text null,
  stripe_payment_intent_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (raffle_id, ticket_number),
  check (
    (status = 'HELD' and reservation_id is not null and reserved_until is not null)
    or (status <> 'HELD' and reserved_until is null)
  )
);

create table public.raffle_orders (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles(id) on delete restrict,
  ticket_id uuid not null references public.raffle_tickets(id) on delete restrict,
  amount integer not null check (amount > 0),
  currency text not null check (currency = upper(currency)),
  status text not null check (status in ('PENDING', 'PAID', 'FAILED', 'CANCELLED')),
  buyer_name text null,
  buyer_email text null,
  stripe_checkout_session_id text unique null,
  stripe_payment_intent_id text null,
  created_at timestamptz not null default now(),
  paid_at timestamptz null
);

create table public.raffle_events (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  ticket_id uuid null references public.raffle_tickets(id) on delete set null,
  event_type text not null check (
    event_type in (
      'TICKET_HELD',
      'HOLD_EXPIRED',
      'CHECKOUT_CREATED',
      'PAYMENT_SUCCEEDED',
      'PAYMENT_FAILED',
      'TICKET_PAID',
      'ADMIN_BLOCKED',
      'ADMIN_RELEASED'
    )
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index raffle_tickets_raffle_status_idx on public.raffle_tickets (raffle_id, status);
create index raffle_tickets_reserved_until_idx on public.raffle_tickets (reserved_until)
  where status = 'HELD';
create index raffle_orders_ticket_id_idx on public.raffle_orders (ticket_id);
create index raffle_events_raffle_created_at_idx on public.raffle_events (raffle_id, created_at desc);

create or replace function public.set_raffle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_raffles_updated_at
before update on public.raffles
for each row execute function public.set_raffle_updated_at();

create trigger set_raffle_tickets_updated_at
before update on public.raffle_tickets
for each row execute function public.set_raffle_updated_at();

create or replace function public.release_expired_raffle_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released_count integer := 0;
begin
  with expired as (
    update public.raffle_tickets as ticket
    set
      status = 'AVAILABLE',
      reservation_id = null,
      reserved_until = null,
      updated_at = now()
    where ticket.status = 'HELD'
      and ticket.reserved_until < now()
    returning
      ticket.raffle_id,
      ticket.id as ticket_id,
      ticket.ticket_number
  )
  insert into public.raffle_events (raffle_id, ticket_id, event_type, metadata)
  select
    expired.raffle_id,
    expired.ticket_id,
    'HOLD_EXPIRED',
    jsonb_build_object('ticket_number', expired.ticket_number)
  from expired;

  get diagnostics released_count = row_count;
  return released_count;
end;
$$;

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
<<fn>>
declare
  target_raffle_id uuid;
  target_ticket public.raffle_tickets%rowtype;
  new_reservation_id uuid := gen_random_uuid();
  new_reserved_until timestamptz;
begin
  if fn.ticket_number not between 1 and 50 then
    raise exception 'ticket_number must be between 1 and 50';
  end if;

  if fn.hold_minutes is null or fn.hold_minutes <= 0 or fn.hold_minutes > 60 then
    raise exception 'hold_minutes must be between 1 and 60';
  end if;

  perform public.release_expired_raffle_holds();

  select raffle.id
  into target_raffle_id
  from public.raffles as raffle
  where raffle.slug = fn.raffle_slug
    and raffle.status = 'ACTIVE';

  if target_raffle_id is null then
    raise exception 'active raffle not found for slug %', fn.raffle_slug;
  end if;

  select ticket.*
  into target_ticket
  from public.raffle_tickets as ticket
  where ticket.raffle_id = target_raffle_id
    and ticket.ticket_number = fn.ticket_number
  for update;

  if target_ticket.id is null then
    raise exception 'ticket % not found for raffle %', fn.ticket_number, fn.raffle_slug;
  end if;

  if target_ticket.status <> 'AVAILABLE' then
    raise exception 'ticket % is not available', fn.ticket_number;
  end if;

  new_reserved_until := now() + make_interval(mins => fn.hold_minutes);

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
      'ticket_number', fn.ticket_number,
      'hold_minutes', fn.hold_minutes
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
<<fn>>
declare
  target_raffle public.raffles%rowtype;
  target_ticket public.raffle_tickets%rowtype;
  existing_order public.raffle_orders%rowtype;
  paid_timestamp timestamptz := now();
  normalized_initials text;
begin
  perform public.release_expired_raffle_holds();

  select raffle.*
  into target_raffle
  from public.raffles as raffle
  where raffle.slug = fn.raffle_slug
    and raffle.status = 'ACTIVE';

  if target_raffle.id is null then
    raise exception 'active raffle not found for slug %', fn.raffle_slug;
  end if;

  if fn.amount <> target_raffle.ticket_price then
    raise exception 'payment amount % does not match raffle ticket price %', fn.amount, target_raffle.ticket_price;
  end if;

  if upper(fn.currency) <> target_raffle.currency then
    raise exception 'payment currency % does not match raffle currency %', fn.currency, target_raffle.currency;
  end if;

  if fn.stripe_checkout_session_id is null then
    raise exception 'stripe_checkout_session_id is required';
  end if;

  select ticket.*
  into target_ticket
  from public.raffle_tickets as ticket
  where ticket.raffle_id = target_raffle.id
    and ticket.ticket_number = fn.ticket_number
  for update;

  if target_ticket.id is null then
    raise exception 'ticket % not found for raffle %', fn.ticket_number, fn.raffle_slug;
  end if;

  select orders.*
  into existing_order
  from public.raffle_orders as orders
  where orders.stripe_checkout_session_id = fn.stripe_checkout_session_id
  limit 1;

  if target_ticket.status = 'PAID' then
    if target_ticket.stripe_checkout_session_id is distinct from fn.stripe_checkout_session_id then
      raise exception 'ticket % is already paid by a different checkout session', fn.ticket_number;
    end if;

    return query
    select target_ticket.id, existing_order.id, target_ticket.status, target_ticket.purchased_at;
    return;
  end if;

  if target_ticket.status <> 'HELD' then
    raise exception 'ticket % must be held before payment can be marked paid', fn.ticket_number;
  end if;

  if fn.reservation_id is null or target_ticket.reservation_id is distinct from fn.reservation_id then
    raise exception 'reservation_id does not match ticket hold';
  end if;

  normalized_initials := nullif(upper(left(regexp_replace(coalesce(fn.buyer_initials, ''), '[^[:alpha:]]', '', 'g'), 4)), '');

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
    fn.amount,
    upper(fn.currency),
    'PAID',
    fn.buyer_name,
    fn.buyer_email,
    fn.stripe_checkout_session_id,
    fn.stripe_payment_intent_id,
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
    stripe_checkout_session_id = fn.stripe_checkout_session_id,
    stripe_payment_intent_id = fn.stripe_payment_intent_id,
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
        'ticket_number', fn.ticket_number,
        'stripe_checkout_session_id', fn.stripe_checkout_session_id
      )
    ),
    (
      target_raffle.id,
      target_ticket.id,
      'TICKET_PAID',
      jsonb_build_object('ticket_number', fn.ticket_number)
    );

  return query
  select target_ticket.id, existing_order.id, target_ticket.status, target_ticket.purchased_at;
end;
$$;

create or replace function public.get_public_raffle_tickets(
  raffle_slug text default 'apple-watch-se-3-2026'
)
returns table (
  ticket_number integer,
  status text,
  buyer_initials text,
  purchased_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ticket.ticket_number,
    ticket.status,
    ticket.buyer_initials,
    ticket.purchased_at
  from public.raffle_tickets as ticket
  join public.raffles as raffle
    on raffle.id = ticket.raffle_id
  where raffle.slug = $1
  order by ticket.ticket_number;
$$;

alter table public.raffles enable row level security;
alter table public.raffle_tickets enable row level security;
alter table public.raffle_orders enable row level security;
alter table public.raffle_events enable row level security;

revoke all on table public.raffles from public, anon, authenticated;
revoke all on table public.raffle_tickets from public, anon, authenticated;
revoke all on table public.raffle_orders from public, anon, authenticated;
revoke all on table public.raffle_events from public, anon, authenticated;

grant all on table public.raffles to service_role;
grant all on table public.raffle_tickets to service_role;
grant all on table public.raffle_orders to service_role;
grant all on table public.raffle_events to service_role;

revoke execute on function public.set_raffle_updated_at() from public, anon, authenticated;
revoke execute on function public.release_expired_raffle_holds() from public, anon, authenticated;
revoke execute on function public.hold_raffle_ticket(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.mark_raffle_ticket_paid(text, integer, uuid, integer, text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.get_public_raffle_tickets(text) from public;

grant execute on function public.release_expired_raffle_holds() to service_role;
grant execute on function public.hold_raffle_ticket(text, integer, integer) to service_role;
grant execute on function public.mark_raffle_ticket_paid(text, integer, uuid, integer, text, text, text, text, text, text) to service_role;
grant execute on function public.get_public_raffle_tickets(text) to anon, authenticated, service_role;

with seeded_raffle as (
  insert into public.raffles (
    slug,
    name,
    prize_name,
    ticket_price,
    currency,
    total_tickets,
    draw_at,
    timezone,
    status
  )
  values (
    'apple-watch-se-3-2026',
    'Rifa Apple Watch SE 3',
    'Apple Watch SE 3',
    34700,
    'MXN',
    50,
    timestamptz '2026-10-15 20:00:00 America/Cancun',
    'America/Cancun',
    'ACTIVE'
  )
  on conflict (slug) do update
  set
    name = excluded.name,
    prize_name = excluded.prize_name,
    ticket_price = excluded.ticket_price,
    currency = excluded.currency,
    total_tickets = excluded.total_tickets,
    draw_at = excluded.draw_at,
    timezone = excluded.timezone,
    status = excluded.status,
    updated_at = now()
  returning id
)
insert into public.raffle_tickets (raffle_id, ticket_number, status)
select seeded_raffle.id, ticket_number, 'AVAILABLE'
from seeded_raffle
cross join generate_series(1, 50) as ticket_number
on conflict (raffle_id, ticket_number) do nothing;
