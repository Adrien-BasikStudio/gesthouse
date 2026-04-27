-- Add FK from household_members.user_id to profiles.id
-- so Supabase PostgREST can resolve the join profiles(display_name, avatar_url)
alter table public.household_members
  add constraint household_members_profile_fk
  foreign key (user_id) references public.profiles(id) on delete cascade;
