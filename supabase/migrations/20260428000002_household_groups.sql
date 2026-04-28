-- Household groups (Famille, Enfants, John, Marie, etc.)
create table public.household_groups (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  emoji text,
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

-- Members of each group
create table public.group_members (
  group_id uuid not null references public.household_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (group_id, user_id)
);

-- Add group_id to tasks and events
alter table public.tasks
  add column group_id uuid references public.household_groups(id) on delete set null;

alter table public.events
  add column group_id uuid references public.household_groups(id) on delete set null;

-- RLS
alter table public.household_groups enable row level security;
alter table public.group_members enable row level security;

create policy "household_groups: select" on public.household_groups
  for select using (public.is_household_member(household_id));
create policy "household_groups: insert" on public.household_groups
  for insert with check (public.is_household_member(household_id));
create policy "household_groups: update" on public.household_groups
  for update using (public.is_household_member(household_id));
create policy "household_groups: delete" on public.household_groups
  for delete using (public.is_household_member(household_id));

create policy "group_members: select" on public.group_members
  for select using (
    exists (
      select 1 from public.household_groups g
      where g.id = group_id and public.is_household_member(g.household_id)
    )
  );
create policy "group_members: insert" on public.group_members
  for insert with check (
    exists (
      select 1 from public.household_groups g
      where g.id = group_id and public.is_household_member(g.household_id)
    )
  );
create policy "group_members: delete" on public.group_members
  for delete using (
    exists (
      select 1 from public.household_groups g
      where g.id = group_id and public.is_household_member(g.household_id)
    )
  );
