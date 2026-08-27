create table if not exists public.body_waist_entries (
  id text primary key,
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,

  measurement_date date not null,
  waist_cm numeric(5, 2) not null
    check (waist_cm between 40 and 250),
  method text not null default 'midpoint'
    check (method in ('midpoint', 'navel')),
  notes text not null default ''
    check (char_length(notes) <= 200),

  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, measurement_date),
  check (client_updated_at >= client_created_at)
);

create index if not exists body_waist_entries_user_date_idx
  on public.body_waist_entries (user_id, measurement_date desc);

drop trigger if exists reconcile_body_waist_update
  on public.body_waist_entries;

create trigger reconcile_body_waist_update
before update on public.body_waist_entries
for each row
execute function public.reconcile_wellness_update();

alter table public.body_waist_entries enable row level security;

revoke all on table public.body_waist_entries from anon;

grant select, insert, update, delete
  on table public.body_waist_entries
  to authenticated;

drop policy if exists "Users can read their waist entries"
  on public.body_waist_entries;
create policy "Users can read their waist entries"
on public.body_waist_entries
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their waist entries"
  on public.body_waist_entries;
create policy "Users can create their waist entries"
on public.body_waist_entries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their waist entries"
  on public.body_waist_entries;
create policy "Users can update their waist entries"
on public.body_waist_entries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their waist entries"
  on public.body_waist_entries;
create policy "Users can delete their waist entries"
on public.body_waist_entries
for delete
to authenticated
using ((select auth.uid()) = user_id);
