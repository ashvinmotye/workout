create table if not exists public.recovery_checkins (
  id text primary key,
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,

  checkin_date date not null,
  sleep_quality smallint not null
    check (sleep_quality between 1 and 5),
  energy_level smallint not null
    check (energy_level between 1 and 5),
  muscle_soreness smallint not null
    check (muscle_soreness between 1 and 5),
  stress_level smallint not null
    check (stress_level between 1 and 5),
  motivation_level smallint not null
    check (motivation_level between 1 and 5),
  readiness_score smallint not null
    check (readiness_score between 0 and 100),
  notes text not null default ''
    check (char_length(notes) <= 500),

  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, checkin_date),
  check (client_updated_at >= client_created_at),
  check (
    readiness_score = (
      sleep_quality
      + energy_level
      + (6 - muscle_soreness)
      + (6 - stress_level)
      + motivation_level
      - 5
    ) * 5
  )
);

create index if not exists recovery_checkins_user_date_idx
  on public.recovery_checkins (user_id, checkin_date desc);

create table if not exists public.body_weight_entries (
  id text primary key,
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,

  measurement_date date not null,
  weight_kg numeric(5, 2) not null
    check (weight_kg between 30 and 300),
  notes text not null default ''
    check (char_length(notes) <= 200),

  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, measurement_date),
  check (client_updated_at >= client_created_at)
);

create index if not exists body_weight_entries_user_date_idx
  on public.body_weight_entries (user_id, measurement_date desc);

create or replace function public.reconcile_wellness_update()
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

drop trigger if exists reconcile_recovery_checkin_update
  on public.recovery_checkins;

create trigger reconcile_recovery_checkin_update
before update on public.recovery_checkins
for each row
execute function public.reconcile_wellness_update();

drop trigger if exists reconcile_body_weight_update
  on public.body_weight_entries;

create trigger reconcile_body_weight_update
before update on public.body_weight_entries
for each row
execute function public.reconcile_wellness_update();

alter table public.recovery_checkins enable row level security;
alter table public.body_weight_entries enable row level security;

revoke all on table public.recovery_checkins from anon;
revoke all on table public.body_weight_entries from anon;

grant select, insert, update, delete
  on table public.recovery_checkins
  to authenticated;

grant select, insert, update, delete
  on table public.body_weight_entries
  to authenticated;

drop policy if exists "Users can read their recovery check-ins"
  on public.recovery_checkins;
create policy "Users can read their recovery check-ins"
on public.recovery_checkins
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their recovery check-ins"
  on public.recovery_checkins;
create policy "Users can create their recovery check-ins"
on public.recovery_checkins
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their recovery check-ins"
  on public.recovery_checkins;
create policy "Users can update their recovery check-ins"
on public.recovery_checkins
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their recovery check-ins"
  on public.recovery_checkins;
create policy "Users can delete their recovery check-ins"
on public.recovery_checkins
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their body-weight entries"
  on public.body_weight_entries;
create policy "Users can read their body-weight entries"
on public.body_weight_entries
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their body-weight entries"
  on public.body_weight_entries;
create policy "Users can create their body-weight entries"
on public.body_weight_entries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their body-weight entries"
  on public.body_weight_entries;
create policy "Users can update their body-weight entries"
on public.body_weight_entries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their body-weight entries"
  on public.body_weight_entries;
create policy "Users can delete their body-weight entries"
on public.body_weight_entries
for delete
to authenticated
using ((select auth.uid()) = user_id);
