-- Vue calculée : solde par utilisateur par groupe de dépenses
-- Positif = on lui doit de l'argent / Négatif = il doit de l'argent
create or replace view public.expense_balances as
select
  e.group_id,
  u.id as user_id,
  coalesce(sum(case when e.paid_by = u.id then e.amount_cents else 0 end), 0)
    - coalesce(sum(es.share_cents), 0)
    + coalesce((
        select sum(s.amount_cents) from public.expense_settlements s
        where s.group_id = e.group_id and s.from_user = u.id
      ), 0)
    - coalesce((
        select sum(s.amount_cents) from public.expense_settlements s
        where s.group_id = e.group_id and s.to_user = u.id
      ), 0)
    as balance_cents
from public.expenses e
join public.expense_shares es on es.expense_id = e.id
join auth.users u on u.id = es.user_id
group by e.group_id, u.id;
