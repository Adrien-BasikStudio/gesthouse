-- ============================================================
-- GestHome — Schéma initial
-- Tables d'abord, fonctions ensuite, RLS en dernier
-- ============================================================

-- ============================================================
-- PROFILS
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  locale text default 'fr',
  created_at timestamptz default now()
);

-- ============================================================
-- FOYERS
-- ============================================================
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text default '🏠',
  created_by uuid not null references auth.users(id),
  plan text not null default 'free' check (plan in ('free', 'family')),
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  created_at timestamptz default now()
);

create table public.household_members (
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','member','guest','child')),
  joined_at timestamptz default now(),
  primary key (household_id, user_id)
);

create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users(id),
  role text not null default 'member',
  token text unique not null,
  expires_at timestamptz not null,
  accepted_at timestamptz
);

-- ============================================================
-- TÂCHES
-- ============================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references auth.users(id),
  due_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references auth.users(id),
  recurrence_rule text,
  rotation_user_ids uuid[],
  rotation_index int default 0,
  category text,
  priority int default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);

create index on public.tasks (household_id, due_at);
create index on public.tasks (household_id, completed_at) where completed_at is null;

-- ============================================================
-- CALENDRIER
-- ============================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean default false,
  location text,
  attendee_ids uuid[],
  recurrence_rule text,
  color text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);

create index on public.events (household_id, starts_at);

-- ============================================================
-- COURSES
-- ============================================================
create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null default 'Courses',
  is_archived boolean default false,
  created_at timestamptz default now()
);

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  quantity numeric default 1,
  unit text,
  category text,
  is_checked boolean default false,
  checked_by uuid references auth.users(id),
  added_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);

create index on public.shopping_items (list_id, is_checked);

-- ============================================================
-- RECETTES & MENU
-- ============================================================
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  servings int default 4,
  prep_minutes int,
  cook_minutes int,
  instructions text,
  image_url text,
  source_url text,
  tags text[],
  is_favorite boolean default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  position int default 0
);

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete set null,
  custom_title text,
  planned_for date not null,
  meal_type text check (meal_type in ('breakfast','lunch','dinner','snack')),
  servings int default 4,
  notes text,
  created_at timestamptz default now()
);

create index on public.meal_plans (household_id, planned_for);

-- ============================================================
-- STOCK
-- ============================================================
create table public.stock_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  quantity numeric default 1,
  unit text,
  location text,
  expires_on date,
  category text,
  low_stock_threshold numeric,
  created_at timestamptz default now()
);

create index on public.stock_items (household_id, expires_on);

-- ============================================================
-- DÉPENSES PARTAGÉES
-- ============================================================
create table public.expense_groups (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  emoji text default '💶',
  currency text not null default 'EUR',
  is_archived boolean default false,
  created_at timestamptz default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.expense_groups(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  paid_by uuid not null references auth.users(id),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'EUR',
  description text not null,
  category text,
  spent_at date not null default current_date,
  receipt_url text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);

create index on public.expenses (group_id, spent_at desc);

create table public.expense_shares (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_cents bigint not null,
  weight numeric,
  primary key (expense_id, user_id)
);

create table public.expense_settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.expense_groups(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  from_user uuid not null references auth.users(id),
  to_user uuid not null references auth.users(id),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'EUR',
  note text,
  settled_at timestamptz default now(),
  created_by uuid not null references auth.users(id)
);

-- ============================================================
-- USAGE IA
-- ============================================================
create table public.ai_usage (
  id bigserial primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  feature text not null,
  input_tokens int,
  output_tokens int,
  cost_cents int,
  created_at timestamptz default now()
);

create index on public.ai_usage (household_id, created_at desc);

-- ============================================================
-- FONCTIONS HELPER (après les tables)
-- ============================================================
create or replace function public.is_household_member(h_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.household_members
    where household_id = h_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_household_admin(h_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.household_members
    where household_id = h_id and user_id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- RLS — activé sur toutes les tables
-- ============================================================
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.meal_plans enable row level security;
alter table public.stock_items enable row level security;
alter table public.expense_groups enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_shares enable row level security;
alter table public.expense_settlements enable row level security;
alter table public.ai_usage enable row level security;

-- Profils
create policy "profiles: select own" on public.profiles for select using (id = auth.uid());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid());
create policy "profiles: insert own" on public.profiles for insert with check (id = auth.uid());

-- Foyers
create policy "households: select" on public.households for select using (public.is_household_member(id));
create policy "households: insert" on public.households for insert with check (created_by = auth.uid());
create policy "households: update" on public.households for update using (public.is_household_admin(id));

-- Membres
create policy "household_members: select" on public.household_members for select using (public.is_household_member(household_id));
create policy "household_members: insert" on public.household_members for insert with check (public.is_household_admin(household_id) or user_id = auth.uid());
create policy "household_members: delete" on public.household_members for delete using (public.is_household_admin(household_id) or user_id = auth.uid());

-- Invitations
create policy "household_invitations: select" on public.household_invitations for select using (public.is_household_member(household_id));
create policy "household_invitations: insert" on public.household_invitations for insert with check (public.is_household_admin(household_id));

-- Tâches
create policy "tasks: select" on public.tasks for select using (public.is_household_member(household_id));
create policy "tasks: insert" on public.tasks for insert with check (public.is_household_member(household_id) and created_by = auth.uid());
create policy "tasks: update" on public.tasks for update using (public.is_household_member(household_id));
create policy "tasks: delete" on public.tasks for delete using (public.is_household_member(household_id));

-- Événements
create policy "events: select" on public.events for select using (public.is_household_member(household_id));
create policy "events: insert" on public.events for insert with check (public.is_household_member(household_id) and created_by = auth.uid());
create policy "events: update" on public.events for update using (public.is_household_member(household_id));
create policy "events: delete" on public.events for delete using (public.is_household_member(household_id));

-- Courses
create policy "shopping_lists: select" on public.shopping_lists for select using (public.is_household_member(household_id));
create policy "shopping_lists: insert" on public.shopping_lists for insert with check (public.is_household_member(household_id));
create policy "shopping_lists: update" on public.shopping_lists for update using (public.is_household_member(household_id));
create policy "shopping_items: select" on public.shopping_items for select using (public.is_household_member(household_id));
create policy "shopping_items: insert" on public.shopping_items for insert with check (public.is_household_member(household_id) and added_by = auth.uid());
create policy "shopping_items: update" on public.shopping_items for update using (public.is_household_member(household_id));
create policy "shopping_items: delete" on public.shopping_items for delete using (public.is_household_member(household_id));

-- Recettes
create policy "recipes: select" on public.recipes for select using (public.is_household_member(household_id));
create policy "recipes: insert" on public.recipes for insert with check (public.is_household_member(household_id) and created_by = auth.uid());
create policy "recipes: update" on public.recipes for update using (public.is_household_member(household_id));
create policy "recipes: delete" on public.recipes for delete using (public.is_household_member(household_id));
create policy "recipe_ingredients: select" on public.recipe_ingredients for select using (exists (select 1 from public.recipes r where r.id = recipe_id and public.is_household_member(r.household_id)));
create policy "recipe_ingredients: insert" on public.recipe_ingredients for insert with check (exists (select 1 from public.recipes r where r.id = recipe_id and public.is_household_member(r.household_id)));
create policy "recipe_ingredients: update" on public.recipe_ingredients for update using (exists (select 1 from public.recipes r where r.id = recipe_id and public.is_household_member(r.household_id)));
create policy "recipe_ingredients: delete" on public.recipe_ingredients for delete using (exists (select 1 from public.recipes r where r.id = recipe_id and public.is_household_member(r.household_id)));
create policy "meal_plans: select" on public.meal_plans for select using (public.is_household_member(household_id));
create policy "meal_plans: insert" on public.meal_plans for insert with check (public.is_household_member(household_id));
create policy "meal_plans: update" on public.meal_plans for update using (public.is_household_member(household_id));
create policy "meal_plans: delete" on public.meal_plans for delete using (public.is_household_member(household_id));

-- Stock
create policy "stock_items: select" on public.stock_items for select using (public.is_household_member(household_id));
create policy "stock_items: insert" on public.stock_items for insert with check (public.is_household_member(household_id));
create policy "stock_items: update" on public.stock_items for update using (public.is_household_member(household_id));
create policy "stock_items: delete" on public.stock_items for delete using (public.is_household_member(household_id));

-- Dépenses
create policy "expense_groups: select" on public.expense_groups for select using (public.is_household_member(household_id));
create policy "expense_groups: insert" on public.expense_groups for insert with check (public.is_household_member(household_id));
create policy "expense_groups: update" on public.expense_groups for update using (public.is_household_member(household_id));
create policy "expenses: select" on public.expenses for select using (public.is_household_member(household_id));
create policy "expenses: insert" on public.expenses for insert with check (public.is_household_member(household_id) and created_by = auth.uid());
create policy "expenses: update" on public.expenses for update using (public.is_household_member(household_id));
create policy "expenses: delete" on public.expenses for delete using (public.is_household_member(household_id));
create policy "expense_shares: select" on public.expense_shares for select using (exists (select 1 from public.expenses e where e.id = expense_id and public.is_household_member(e.household_id)));
create policy "expense_shares: insert" on public.expense_shares for insert with check (exists (select 1 from public.expenses e where e.id = expense_id and public.is_household_member(e.household_id)));
create policy "expense_shares: delete" on public.expense_shares for delete using (exists (select 1 from public.expenses e where e.id = expense_id and public.is_household_member(e.household_id)));
create policy "expense_settlements: select" on public.expense_settlements for select using (public.is_household_member(household_id));
create policy "expense_settlements: insert" on public.expense_settlements for insert with check (public.is_household_member(household_id) and created_by = auth.uid());

-- Usage IA
create policy "ai_usage: select" on public.ai_usage for select using (public.is_household_member(household_id));
create policy "ai_usage: insert" on public.ai_usage for insert with check (public.is_household_member(household_id) and user_id = auth.uid());

-- ============================================================
-- TRIGGER : crée le profil automatiquement à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
