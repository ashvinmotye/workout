-- Independent fitness-check storage and the 19:00 reminder preference.
-- Apply after the existing wellbeing_notifications migration.
create table if not exists public.fitness_check_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  anchor_date date,
  exercises jsonb not null default '[]'::jsonb,
  results jsonb not null default '[]'::jsonb,
  config_updated_at bigint not null default 0,
  reset_at bigint not null default 0,
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(exercises) = 'array'),
  check (jsonb_typeof(results) = 'array')
);

alter table public.fitness_check_data enable row level security;
revoke all on table public.fitness_check_data from anon;
grant select, insert, update on table public.fitness_check_data to authenticated;

drop policy if exists "Users can read their fitness checks" on public.fitness_check_data;
create policy "Users can read their fitness checks"
on public.fitness_check_data for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their fitness checks" on public.fitness_check_data;
create policy "Users can create their fitness checks"
on public.fitness_check_data for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their fitness checks" on public.fitness_check_data;
create policy "Users can update their fitness checks"
on public.fitness_check_data for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

alter table public.wellbeing_notification_preferences
  add column if not exists fitness_enabled boolean not null default true;

alter table public.wellbeing_notifications
  drop constraint if exists wellbeing_notifications_type_check;
alter table public.wellbeing_notifications
  add constraint wellbeing_notifications_type_check
  check (type in ('weight', 'waist', 'workout', 'fitness'));
