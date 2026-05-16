-- Rate-limit log for the AI assistant chat endpoint.
--
-- One row per /api/assistant/chat invocation. The route counts rows in a
-- sliding window (last hour, last minute) for the calling user and rejects
-- with 429 if the count is over the budget. Old rows are pruned periodically.
--
-- Why a table and not in-memory: serverless Next on Vercel spins multiple
-- instances; in-memory counters would diverge per instance. A tiny shared
-- table keeps the limit consistent across the fleet.

create table public.assistant_rate_limit (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  called_at timestamptz not null default now()
);

-- Composite descending index supports the hot query:
--   SELECT count(*) FROM assistant_rate_limit
--   WHERE user_id = ? AND called_at > now() - interval '1 hour';
create index assistant_rate_limit_user_called_idx
  on public.assistant_rate_limit (user_id, called_at desc);

-- RLS — only the user can see their own rows (we use the service role
-- internally for the rate check anyway, but defense in depth).
alter table public.assistant_rate_limit enable row level security;

create policy "assistant_rate_limit owner read"
on public.assistant_rate_limit for select
to authenticated
using (user_id = (select auth.uid()));

-- No INSERT policy for anon/authenticated — only the server (service role)
-- writes rate-limit rows.
