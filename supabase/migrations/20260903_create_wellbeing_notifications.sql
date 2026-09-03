-- Wellbeing v33 notification preferences, device subscriptions and manually
-- cleared notification history. This migration is additive and idempotent.

create table if not exists public.wellbeing_notification_preferences (
  user_id uuid primary key
    references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  weight_enabled boolean not null default true,
  waist_enabled boolean not null default true,
  workout_enabled boolean not null default true,
  time_zone text not null default 'Indian/Mauritius'
    check (char_length(time_zone) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wellbeing_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wellbeing_push_subscriptions_user_idx
  on public.wellbeing_push_subscriptions (user_id);

create table if not exists public.wellbeing_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references auth.users(id) on delete cascade,
  type text not null
    check (type in ('weight', 'waist', 'workout')),
  title text not null
    check (char_length(title) between 1 and 120),
  body text not null
    check (char_length(body) between 1 and 500),
  notification_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, notification_key)
);

create index if not exists wellbeing_notifications_user_created_idx
  on public.wellbeing_notifications (user_id, created_at desc);

create or replace function public.set_wellbeing_notification_updated_at()
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

drop trigger if exists set_wellbeing_notification_preferences_updated_at
  on public.wellbeing_notification_preferences;
create trigger set_wellbeing_notification_preferences_updated_at
before update on public.wellbeing_notification_preferences
for each row execute function public.set_wellbeing_notification_updated_at();

drop trigger if exists set_wellbeing_push_subscriptions_updated_at
  on public.wellbeing_push_subscriptions;
create trigger set_wellbeing_push_subscriptions_updated_at
before update on public.wellbeing_push_subscriptions
for each row execute function public.set_wellbeing_notification_updated_at();

alter table public.wellbeing_notification_preferences enable row level security;
alter table public.wellbeing_push_subscriptions enable row level security;
alter table public.wellbeing_notifications enable row level security;

revoke all on table public.wellbeing_notification_preferences from anon;
revoke all on table public.wellbeing_push_subscriptions from anon, authenticated;
revoke all on table public.wellbeing_notifications from anon;

grant select on table public.wellbeing_notification_preferences to authenticated;
grant select, delete on table public.wellbeing_notifications to authenticated;

drop policy if exists "Users can read their Wellbeing notification preferences"
  on public.wellbeing_notification_preferences;
create policy "Users can read their Wellbeing notification preferences"
on public.wellbeing_notification_preferences
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their Wellbeing notifications"
  on public.wellbeing_notifications;
create policy "Users can read their Wellbeing notifications"
on public.wellbeing_notifications
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can clear their Wellbeing notifications"
  on public.wellbeing_notifications;
create policy "Users can clear their Wellbeing notifications"
on public.wellbeing_notifications
for delete to authenticated
using ((select auth.uid()) = user_id);
