-- Komentari roditelja na izveštaje.
-- Roditelj ostavi kratak komentar preko portala; profesor ga vidi na app strani.

create table public.report_comments (
  id uuid primary key default gen_random_uuid(),
  report_log_id uuid not null references public.report_logs (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,

  -- Ko je ostavio (parent ili teacher za buduce reply-e). Za sad samo parent.
  author text not null check (author in ('parent', 'teacher')),
  body text not null,

  -- Read state — profesor čita.
  read_by_teacher_at timestamptz,

  created_at timestamptz not null default now()
);

create index report_comments_report_idx
  on public.report_comments (report_log_id, created_at desc);

create index report_comments_org_unread_idx
  on public.report_comments (organization_id)
  where read_by_teacher_at is null;

-- RLS
alter table public.report_comments enable row level security;

create policy "report_comments select own org"
  on public.report_comments for select
  to authenticated
  using (organization_id = public.current_organization_id());

create policy "report_comments update own org"
  on public.report_comments for update
  to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

-- Roditelj komentari idu kroz service-role klijenta (kao homework submission).
