-- Allow the on-demand Holiday routine type in existing Wellbeing deployments.
-- Existing rows and routine data are not changed.

alter table public.saved_workouts
  drop constraint if exists saved_workouts_routine_role_valid;

alter table public.saved_workouts
  add constraint saved_workouts_routine_role_valid
  check (routine_role in ('pre', 'main', 'post', 'holiday'));
