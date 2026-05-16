-- Per-user "last seen" pointer for the in-app notification bell.
--
-- We don't store individual notifications — they're derived on the fly from
-- the events that already exist (booking_requests, homework, report_logs,
-- payments). Each user has one row tracking when they last opened the bell;
-- the count + feed query filters source rows newer than that.

create table public.user_notification_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen_at timestamptz not null default '1970-01-01T00:00:00Z',
  updated_at timestamptz not null default now()
);

alter table public.user_notification_state enable row level security;

create policy "user_notification_state self read"
on public.user_notification_state for select
to authenticated
using (user_id = (select auth.uid()));

create policy "user_notification_state self upsert"
on public.user_notification_state for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "user_notification_state self update"
on public.user_notification_state for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
