-- Lessons (scheduled and historical).

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled_by_teacher', 'cancelled_by_student', 'no_show')),
  price integer not null default 0,                 -- u parama
  notes_after_lesson text,
  topics_covered text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index lessons_org_scheduled_idx
  on public.lessons (organization_id, scheduled_at)
  where deleted_at is null;

create index lessons_student_scheduled_idx
  on public.lessons (student_id, scheduled_at)
  where deleted_at is null;

create trigger lessons_set_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

alter table public.lessons enable row level security;

create policy "lessons select own org"
on public.lessons for select
to authenticated
using (organization_id = public.current_organization_id() and deleted_at is null);

create policy "lessons insert own org"
on public.lessons for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "lessons update own org"
on public.lessons for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());
