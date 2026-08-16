create table if not exists public.workout_sessions (
  id text primary key,
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,

  workout_name text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  status text not null
    check (status in ('completed', 'partial')),

  duration_seconds integer not null default 0
    check (duration_seconds >= 0),
  planned_rounds integer not null default 1
    check (planned_rounds >= 1),
  completed_rounds integer not null default 0
    check (completed_rounds >= 0),

  exercises jsonb not null default '[]'::jsonb
    check (jsonb_typeof(exercises) = 'array'),

  rpe smallint
    check (rpe between 1 and 10),
  zone_1_seconds integer
    check (zone_1_seconds >= 0),
  zone_2_seconds integer
    check (zone_2_seconds >= 0),
  zone_3_seconds integer
    check (zone_3_seconds >= 0),
  zone_4_seconds integer
    check (zone_4_seconds >= 0),
  zone_5_seconds integer
    check (zone_5_seconds >= 0),
  notes text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_sessions_user_ended_at_idx
  on public.workout_sessions (user_id, ended_at desc);

create or replace function public.set_workout_sessions_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_workout_sessions_updated_at
  on public.workout_sessions;

create trigger set_workout_sessions_updated_at
before update on public.workout_sessions
for each row
execute function public.set_workout_sessions_updated_at();

alter table public.workout_sessions enable row level security;

revoke all on table public.workout_sessions from anon;

grant select, insert, update, delete
  on table public.workout_sessions
  to authenticated;

drop policy if exists "Users can read their workout sessions"
  on public.workout_sessions;

create policy "Users can read their workout sessions"
on public.workout_sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their workout sessions"
  on public.workout_sessions;

create policy "Users can create their workout sessions"
on public.workout_sessions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their workout sessions"
  on public.workout_sessions;

create policy "Users can update their workout sessions"
on public.workout_sessions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their workout sessions"
  on public.workout_sessions;

create policy "Users can delete their workout sessions"
on public.workout_sessions
for delete
to authenticated
using ((select auth.uid()) = user_id);
