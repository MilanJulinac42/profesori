-- Students table.

create table public.students (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null,
  grade text,
  school text,
  parent_name text,
  parent_phone text,
  parent_email text,
  default_price_per_lesson integer not null default 0,  -- u parama (1500 RSD = 150000)
  notes text,
  tags text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'paused', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index students_organization_id_idx
  on public.students (organization_id)
  where deleted_at is null;

create index students_status_idx
  on public.students (organization_id, status)
  where deleted_at is null;

create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

alter table public.students enable row level security;

create policy "students select own org"
on public.students for select
to authenticated
using (organization_id = public.current_organization_id() and deleted_at is null);

create policy "students insert own org"
on public.students for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "students update own org"
on public.students for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());
