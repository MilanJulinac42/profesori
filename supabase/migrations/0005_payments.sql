-- Payments recorded by the teacher. The platform never processes money.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  amount integer not null check (amount > 0),  -- u parama
  paid_at timestamptz not null default now(),
  method text not null default 'cash'
    check (method in ('cash', 'transfer', 'revolut', 'other')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index payments_student_paid_idx
  on public.payments (student_id, paid_at desc)
  where deleted_at is null;

create index payments_org_paid_idx
  on public.payments (organization_id, paid_at desc)
  where deleted_at is null;

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

create policy "payments select own org"
on public.payments for select
to authenticated
using (organization_id = public.current_organization_id() and deleted_at is null);

create policy "payments insert own org"
on public.payments for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "payments update own org"
on public.payments for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());
