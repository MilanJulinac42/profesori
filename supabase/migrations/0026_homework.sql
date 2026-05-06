-- Domaći zadaci (homework) sa public-link tracking-om.
--
-- Tok: profesor zadaje domaći vezan za odrađen čas. Učenik/roditelj
-- prima public link (/h/[public_token]) i može da označi "uradio sam" +
-- ostavi komentar. Profesor zatim ocenjuje i daje feedback.

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,

  -- Čas posle kog je domaći zadat (može biti null ako se domaći ne vezuje
  -- za konkretan čas, npr. ručno zadat van časa).
  lesson_id uuid references public.lessons (id) on delete set null,

  -- Linkovan generisani exercise set (opciono — profesor može i slobodno
  -- da otkuca opis bez seta).
  exercise_set_id uuid references public.exercise_sets (id) on delete set null,

  -- Sadržaj
  title text not null,
  description text,
  due_date date,

  -- Status
  status text not null default 'assigned'
    check (status in ('assigned', 'submitted', 'graded', 'skipped')),

  -- Predaja (od strane učenika/roditelja preko public linka)
  submission_note text,
  submitted_at timestamptz,

  -- Ocena profesora
  teacher_grade smallint
    check (teacher_grade is null or teacher_grade between 1 and 5),
  teacher_feedback text,
  graded_at timestamptz,

  -- Public-link autorizacija (32 hex chars). Default: nasumičan.
  public_token text not null
    default encode(gen_random_bytes(16), 'hex'),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Indexi
create index homework_org_due_idx
  on public.homework (organization_id, due_date)
  where deleted_at is null;

create index homework_student_status_idx
  on public.homework (student_id, status)
  where deleted_at is null;

create index homework_status_idx
  on public.homework (organization_id, status)
  where deleted_at is null;

create unique index homework_public_token_idx
  on public.homework (public_token);

-- updated_at trigger
create trigger homework_set_updated_at
  before update on public.homework
  for each row
  execute function public.set_updated_at();

-- RLS
alter table public.homework enable row level security;

create policy "homework select own org"
  on public.homework for select
  to authenticated
  using (
    organization_id = public.current_organization_id()
    and deleted_at is null
  );

create policy "homework insert own org"
  on public.homework for insert
  to authenticated
  with check (organization_id = public.current_organization_id());

create policy "homework update own org"
  on public.homework for update
  to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

-- Public read i submission preko anon ključa rade kroz dedikovanu RPC
-- funkciju koja prima public_token i menja status. RLS ostaje strogo
-- za authenticated korisnike (profesor); anon nikad ne čita tabelu
-- direktno. Vidi src/lib/homework/public-actions.ts.
