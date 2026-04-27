-- Add FK from tasks.assigned_to to profiles.id
-- so PostgREST can resolve profiles:assigned_to(display_name)
alter table public.tasks
  add constraint tasks_assigned_to_profile_fk
  foreign key (assigned_to) references public.profiles(id) on delete set null;
