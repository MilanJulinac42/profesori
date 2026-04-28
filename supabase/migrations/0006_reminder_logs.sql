-- Audit log of payment reminders sent to students/parents.

create table public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  channel text not null check (channel in ('copy', 'sms', 'email', 'viber')),
  amount_at_send integer not null check (amount_at_send >= 0),  -- u parama
  message text not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index reminder_logs_student_idx
  on public.reminder_logs (student_id, sent_at desc);

create index reminder_logs_org_idx
  on public.reminder_logs (organization_id, sent_at desc);

alter table public.reminder_logs enable row level security;

create policy "reminder_logs select own org"
on public.reminder_logs for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "reminder_logs insert own org"
on public.reminder_logs for insert
to authenticated
with check (organization_id = public.current_organization_id());
