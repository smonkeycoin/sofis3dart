-- READ ONLY. Run in the production project's SQL editor; keep results private.
begin transaction isolation level repeatable read read only;
select now() as captured_at, current_database(), current_user;
select * from public.raffles where slug = 'apple-watch-se-3-2026';
select t.ticket_number, t.status, t.purchased_at, t.updated_at,
       o.id as order_id, o.status as order_status, o.buyer_name, o.buyer_email,
       o.amount, o.currency, o.paid_at, o.stripe_checkout_session_id,
       o.stripe_payment_intent_id, o.confirmation_email_resend_id
from public.raffle_tickets t
join public.raffles r on r.id=t.raffle_id
left join public.raffle_orders o on o.ticket_id=t.id
where r.slug='apple-watch-se-3-2026'
order by t.ticket_number, o.created_at;
select e.* from public.raffle_events e join public.raffles r on r.id=e.raffle_id
where r.slug='apple-watch-se-3-2026' order by e.created_at,e.id;
select t.* from public.raffle_tickets t join public.raffles r on r.id=t.raffle_id
where r.slug='apple-watch-se-3-2026' and t.ticket_number in (1,24,26,34,36) order by t.ticket_number;
-- Live RLS, policies, view definitions and executable RPC privileges.
select n.nspname,c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('raffles','raffle_tickets','raffle_orders','raffle_events','public_raffle_ticket_states','public_raffle_tickets');
select * from pg_policies where schemaname='public' and tablename like '%raffle%';
select * from information_schema.role_table_grants where table_schema='public' and table_name like '%raffle%' order by table_name,grantee;
select schemaname,viewname,definition from pg_views where schemaname='public' and viewname like '%raffle%';
select p.oid::regprocedure as function,p.prosecdef,p.proconfig,p.proacl,pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname like '%raffle%';
select event_object_table,trigger_name,action_statement from information_schema.triggers
where event_object_schema='public' and event_object_table like '%raffle%';
commit;
