-- Audit log for cron + on-demand report runs.
--
-- Every invocation of /api/cron/reports (and the manual "Pošalji sada"
-- action) writes one row here so the teacher can see when the system
-- last fired, how it went, and what was sent.
--
-- Scope: rows are either GLOBAL (org_id = null, written by the cron) or
-- per-org (org_id set, written by the manual action). The settings UI
-- queries both for the calling teacher's org.

create table public.cron_run_logs (
  id bigserial primary key,
  -- "weekly" | "monthly" — matches reports.kind
  kind text not null check (kind in ('weekly', 'monthly')),
  -- "cron" = scheduled, "manual" = teacher hit "Pošalji sada"
  source text not null check (source in ('cron', 'manual')),
  -- Null = system-wide cron run. Set for manual triggers.
  organization_id uuid references public.organizations (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  -- 'ok' (no failures), 'partial' (some sent, some failed), 'failed' (boot error), 'running'
  status text not null default 'running'
    check (status in ('running', 'ok', 'partial', 'failed')),
  -- Free-form summary (orgs_processed, sent, skipped, failed, failures[])
  stats jsonb,
  error text
);

-- Recent logs for an org's UI: filter by org (or null for global cron) +
-- kind, ordered by started_at desc.
create index cron_run_logs_org_started_idx
  on public.cron_run_logs (organization_id, started_at desc);

create index cron_run_logs_global_started_idx
  on public.cron_run_logs (started_at desc)
  where organization_id is null;

-- RLS: org members can see their own org's logs + the global cron logs
-- (so they know when the system last fired for their account).
alter table public.cron_run_logs enable row level security;

create policy "cron_run_logs owner read"
on public.cron_run_logs for select
to authenticated
using (
  organization_id is null
  or organization_id = public.current_organization_id()
);

-- Only the server (service role) writes. No INSERT/UPDATE policy for
-- authenticated; manual runs go through a server action that uses the
-- admin client.
