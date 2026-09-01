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

    if target_order.amount <> requested_amount or target_order.currency <> upper(requested_currency) then
      raise exception 'order amount or currency does not match paid checkout';
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

  if target_order.id is null then
    if target_ticket.status <> 'HELD' then
      raise exception 'ticket % must be held before payment can be marked paid', requested_ticket_number;
    end if;

    if requested_reservation_id is null or target_ticket.reservation_id is distinct from requested_reservation_id then
      raise exception 'reservation_id does not match ticket hold';
    end if;
  else
    if target_order.status not in ('PENDING', 'CANCELLED') then
      raise exception 'order % cannot be marked paid from status %', target_order.id, target_order.status;
    end if;

    if requested_reservation_id is null
      or target_order.reservation_id is distinct from requested_reservation_id then
      raise exception 'order reservation_id does not match paid checkout';
    end if;

    if target_ticket.status not in ('HELD', 'AVAILABLE') then
      raise exception 'ticket % cannot be marked paid from status %', requested_ticket_number, target_ticket.status;
    end if;

    if target_ticket.status = 'HELD'
      and target_ticket.reservation_id is distinct from requested_reservation_id then
      raise exception 'reservation_id does not match ticket hold';
    end if;

    if target_ticket.status = 'AVAILABLE'
      and target_ticket.stripe_checkout_session_id is not null
      and target_ticket.stripe_checkout_session_id <> requested_checkout_session_id then
      raise exception 'available ticket has a different checkout session';
    end if;
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

revoke execute on function public.mark_raffle_ticket_paid(text, integer, uuid, integer, text, text, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.mark_raffle_ticket_paid(text, integer, uuid, integer, text, text, text, text, text, text, uuid) to service_role;
