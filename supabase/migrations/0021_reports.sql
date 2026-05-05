-- Reports infrastructure: per-student preferences + audit log of sent reports.

-- ===== Students: report preferences =====
alter table public.students
  add column student_email text,
  add column report_audience text not null default 'parent'
    check (report_audience in ('parent', 'student')),
  add column weekly_reports_enabled boolean not null default true,
  add column monthly_reports_enabled boolean not null default true;

-- ===== report_logs: audit trail of every sent report =====
create table public.report_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,

  kind text not null check (kind in ('weekly', 'monthly')),
  audience text not null check (audience in ('parent', 'student')),

  -- Period covered (inclusive start, exclusive end).
  period_start date not null,
  period_end date not null,

  -- Resend identifiers / delivery state.
  recipient_email text not null,
  resend_message_id text,
  status text not null default 'sent' check (status in ('sent', 'failed', 'preview')),
  error_message text,

  -- Snapshot for audit / re-send / debugging — full HTML + assembled data.
  subject text not null,
  html_body text not null,
  data_snapshot jsonb not null default '{}'::jsonb,

  -- AI usage telemetry.
  ai_input_tokens integer not null default 0,
  ai_output_tokens integer not null default 0,

  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index report_logs_organization_id_idx
  on public.report_logs (organization_id, sent_at desc);

create index report_logs_student_id_idx
  on public.report_logs (student_id, sent_at desc);

create unique index report_logs_unique_period_idx
  on public.report_logs (student_id, kind, period_start)
  where status = 'sent';

alter table public.report_logs enable row level security;

create policy "report_logs select own org"
on public.report_logs for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "report_logs insert own org"
on public.report_logs for insert
to authenticated
with check (organization_id = public.current_organization_id());
