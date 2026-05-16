-- Web Push API subscriptions per user.
--
-- Each row is a single browser/device the teacher has authorized for
-- push. A teacher can have multiple subscriptions (phone + desktop). The
-- endpoint URL is unique globally — re-subscribing from the same browser
-- on the same site reuses the endpoint, so an UPSERT on endpoint is the
-- right shape for "subscribe me now".

create table public.push_subscriptions (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions self read"
on public.push_subscriptions for select
to authenticated
using (user_id = (select auth.uid()));

create policy "push_subscriptions self insert"
on public.push_subscriptions for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "push_subscriptions self delete"
on public.push_subscriptions for delete
to authenticated
using (user_id = (select auth.uid()));
