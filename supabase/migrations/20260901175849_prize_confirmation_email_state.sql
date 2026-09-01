alter table public.raffle_orders
  add column confirmation_email_sent_at timestamptz null,
  add column confirmation_email_failed_at timestamptz null,
  add column confirmation_email_last_error text null,
  add column confirmation_email_resend_id text null;

create index raffle_orders_confirmation_email_pending_idx
  on public.raffle_orders (paid_at)
  where status = 'PAID'
    and buyer_email is not null
    and confirmation_email_sent_at is null;

alter table public.raffle_events
  drop constraint raffle_events_event_type_check;

alter table public.raffle_events
  add constraint raffle_events_event_type_check
  check (
    event_type in (
      'TICKET_HELD',
      'HOLD_EXPIRED',
      'CHECKOUT_CREATED',
      'PAYMENT_SUCCEEDED',
      'PAYMENT_FAILED',
      'TICKET_PAID',
      'CONFIRMATION_EMAIL_SENT',
      'CONFIRMATION_EMAIL_FAILED',
      'ADMIN_BLOCKED',
      'ADMIN_RELEASED'
    )
  );
