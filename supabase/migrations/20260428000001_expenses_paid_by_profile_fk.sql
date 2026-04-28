-- FK expenses.paid_by -> profiles.id so PostgREST resolves profiles:paid_by(display_name)
alter table public.expenses
  add constraint expenses_paid_by_profile_fk
  foreign key (paid_by) references public.profiles(id) on delete restrict;
