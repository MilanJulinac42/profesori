-- Onboarding state: kad je profesor video intro tour.
-- Null = nije video; timestamp = video i kliknuo Završi (ili Preskoči).

alter table public.users
  add column onboarding_completed_at timestamptz;

-- Indexa za filtriranje aktivnih korisnika koji još nisu prošli tour
-- (za interni dashboard / metrike kasnije).
create index users_onboarding_pending_idx
  on public.users (id)
  where onboarding_completed_at is null and deleted_at is null;
