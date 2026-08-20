-- Additive migration: no rows, tables, policies, or existing columns are removed.

alter table public.saved_workouts
  add column if not exists designated_days smallint[] not null default '{}'::smallint[],
  add column if not exists routine_role text not null default 'main';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'saved_workouts_designated_days_valid'
      and conrelid = 'public.saved_workouts'::regclass
  ) then
    alter table public.saved_workouts
      add constraint saved_workouts_designated_days_valid
      check (
        cardinality(designated_days) <= 7
        and designated_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'saved_workouts_routine_role_valid'
      and conrelid = 'public.saved_workouts'::regclass
  ) then
    alter table public.saved_workouts
      add constraint saved_workouts_routine_role_valid
      check (routine_role in ('pre', 'main', 'post'));
  end if;
end;
$$;

-- Keep the historical workout_name snapshot while linking a session to the
-- stable saved-routine identity. Deliberately omit a foreign key so deleting a
-- saved routine never deletes or alters its historical sessions.
alter table public.workout_sessions
  add column if not exists routine_id text;

create index if not exists workout_sessions_user_routine_ended_at_idx
  on public.workout_sessions (user_id, routine_id, ended_at desc)
  where routine_id is not null;
