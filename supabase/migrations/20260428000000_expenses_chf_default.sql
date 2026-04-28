-- Switch default currency to CHF
alter table public.expense_groups alter column currency set default 'CHF';
alter table public.expenses alter column currency set default 'CHF';
alter table public.expense_settlements alter column currency set default 'CHF';
