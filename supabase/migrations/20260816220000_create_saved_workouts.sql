create table if not exists public.saved_workouts (
  id text primary key,
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,

  name text not null
    check (char_length(name) between 1 and 120),
  workout jsonb not null
    check (jsonb_typeof(workout) = 'object'),
  sort_order integer not null default 0
    check (sort_order >= 0),

  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (client_updated_at >= client_created_at)
);

create index if not exists saved_workouts_user_sort_order_idx
  on public.saved_workouts (user_id, sort_order, client_updated_at desc);

create or replace function public.reconcile_saved_workout_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.client_updated_at < old.client_updated_at then
    return old;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reconcile_saved_workout_update
  on public.saved_workouts;

create trigger reconcile_saved_workout_update
before update on public.saved_workouts
for each row
execute function public.reconcile_saved_workout_update();

alter table public.saved_workouts enable row level security;

revoke all on table public.saved_workouts from anon;

grant select, insert, update, delete
  on table public.saved_workouts
  to authenticated;

drop policy if exists "Users can read their saved workouts"
  on public.saved_workouts;

create policy "Users can read their saved workouts"
on public.saved_workouts
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can create their saved workouts"
  on public.saved_workouts;

create policy "Users can create their saved workouts"
on public.saved_workouts
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can update their saved workouts"
  on public.saved_workouts;

create policy "Users can update their saved workouts"
on public.saved_workouts
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can delete their saved workouts"
  on public.saved_workouts;

create policy "Users can delete their saved workouts"
on public.saved_workouts
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
