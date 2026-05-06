-- Fix security: remove auth.users JOIN from expense_balances view
-- The JOIN was flagged by Supabase as exposing auth data via the public API.
-- The JOIN was also redundant: u.id = es.user_id by definition.
-- We also add security_invoker so the view respects the caller's RLS policies.

create or replace view public.expense_balances
  with (security_invoker = true)
as
select
  e.group_id,
  es.user_id,
  coalesce(sum(case when e.paid_by = es.user_id then e.amount_cents else 0 end), 0)
    - coalesce(sum(es.share_cents), 0)
    + coalesce((
        select sum(s.amount_cents) from public.expense_settlements s
        where s.group_id = e.group_id and s.from_user = es.user_id
      ), 0)
    - coalesce((
        select sum(s.amount_cents) from public.expense_settlements s
        where s.group_id = e.group_id and s.to_user = es.user_id
      ), 0)
    as balance_cents
from public.expenses e
join public.expense_shares es on es.expense_id = e.id
group by e.group_id, es.user_id;
