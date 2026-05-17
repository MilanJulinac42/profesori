-- Kurikulumi i plan učenja po učeniku.
--
-- Profesor pravi kurikulum (predmet + razred + uređene teme), dodeljuje
-- ga učeniku, i ručno označava status po podtemama dok napreduju kroz
-- gradivo. 5 tabela: curricula, curriculum_units, student_curricula,
-- student_unit_progress, lesson_units. RLS po organization_id (direktno
-- ili kroz student/lesson chain).
--
-- Dizajn ograničenja:
--  * Jedan kurikulum po (subject, grade) — interno se grana kroz sekcije.
--  * 2 nivoa max (sekcija → podtema), enforce-uje aplikacija ne baza.
--  * Učenik može imati više aktivnih kurikuluma istovremeno (npr. školski
--    + priprema za upis), ali ne dva ista aktivna paralelno.
--  * "mastered" je samo manual toggle u Phase 1 — bez auto-pravila.

------------------------------------------------------------------------
-- curricula
------------------------------------------------------------------------

create table public.curricula (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  subject text not null,
  grade_label text,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index curricula_org_idx
  on public.curricula (organization_id)
  where deleted_at is null;

create trigger curricula_set_updated_at
  before update on public.curricula
  for each row execute function public.set_updated_at();

alter table public.curricula enable row level security;

create policy "curricula select own org"
  on public.curricula for select
  to authenticated
  using (
    organization_id = public.current_organization_id()
    and deleted_at is null
  );

create policy "curricula insert own org"
  on public.curricula for insert
  to authenticated
  with check (organization_id = public.current_organization_id());

create policy "curricula update own org"
  on public.curricula for update
  to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

------------------------------------------------------------------------
-- curriculum_units
-- parent_unit_id NULL = sekcija, ne-NULL = podtema (max 2 nivoa).
------------------------------------------------------------------------

create table public.curriculum_units (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curricula (id) on delete cascade,
  parent_unit_id uuid references public.curriculum_units (id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 0,
  est_lessons integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index curriculum_units_curriculum_idx
  on public.curriculum_units (curriculum_id, parent_unit_id, order_index);

create trigger curriculum_units_set_updated_at
  before update on public.curriculum_units
  for each row execute function public.set_updated_at();

alter table public.curriculum_units enable row level security;

create policy "curriculum_units select own org"
  on public.curriculum_units for select
  to authenticated
  using (
    exists (
      select 1 from public.curricula c
      where c.id = curriculum_units.curriculum_id
        and c.organization_id = public.current_organization_id()
        and c.deleted_at is null
    )
  );

create policy "curriculum_units insert own org"
  on public.curriculum_units for insert
  to authenticated
  with check (
    exists (
      select 1 from public.curricula c
      where c.id = curriculum_units.curriculum_id
        and c.organization_id = public.current_organization_id()
    )
  );

create policy "curriculum_units update own org"
  on public.curriculum_units for update
  to authenticated
  using (
    exists (
      select 1 from public.curricula c
      where c.id = curriculum_units.curriculum_id
        and c.organization_id = public.current_organization_id()
    )
  )
  with check (
    exists (
      select 1 from public.curricula c
      where c.id = curriculum_units.curriculum_id
        and c.organization_id = public.current_organization_id()
    )
  );

create policy "curriculum_units delete own org"
  on public.curriculum_units for delete
  to authenticated
  using (
    exists (
      select 1 from public.curricula c
      where c.id = curriculum_units.curriculum_id
        and c.organization_id = public.current_organization_id()
    )
  );

------------------------------------------------------------------------
-- student_curricula
-- Many-to-many. ended_at NULL = aktivno. Partial unique index sprečava
-- isti aktivni kurikulum dva puta za istog učenika.
------------------------------------------------------------------------

create table public.student_curricula (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  curriculum_id uuid not null references public.curricula (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create unique index student_curricula_one_active_idx
  on public.student_curricula (student_id, curriculum_id)
  where ended_at is null;

create index student_curricula_student_idx
  on public.student_curricula (student_id)
  where ended_at is null;

alter table public.student_curricula enable row level security;

create policy "student_curricula select own org"
  on public.student_curricula for select
  to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = student_curricula.student_id
        and s.organization_id = public.current_organization_id()
        and s.deleted_at is null
    )
  );

create policy "student_curricula insert own org"
  on public.student_curricula for insert
  to authenticated
  with check (
    exists (
      select 1 from public.students s
      where s.id = student_curricula.student_id
        and s.organization_id = public.current_organization_id()
    )
  );

create policy "student_curricula update own org"
  on public.student_curricula for update
  to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = student_curricula.student_id
        and s.organization_id = public.current_organization_id()
    )
  )
  with check (
    exists (
      select 1 from public.students s
      where s.id = student_curricula.student_id
        and s.organization_id = public.current_organization_id()
    )
  );

create policy "student_curricula delete own org"
  on public.student_curricula for delete
  to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = student_curricula.student_id
        and s.organization_id = public.current_organization_id()
    )
  );

------------------------------------------------------------------------
-- student_unit_progress
-- Per-učenik, per-unit progres. Unique po (student_curriculum, unit).
------------------------------------------------------------------------

create table public.student_unit_progress (
  id uuid primary key default gen_random_uuid(),
  student_curriculum_id uuid not null
    references public.student_curricula (id) on delete cascade,
  unit_id uuid not null
    references public.curriculum_units (id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','mastered','skipped')),
  last_lesson_id uuid references public.lessons (id) on delete set null,
  mastered_at timestamptz,
  notes text,
  updated_at timestamptz not null default now(),
  unique (student_curriculum_id, unit_id)
);

create index student_unit_progress_sc_idx
  on public.student_unit_progress (student_curriculum_id);

create trigger student_unit_progress_set_updated_at
  before update on public.student_unit_progress
  for each row execute function public.set_updated_at();

alter table public.student_unit_progress enable row level security;

create policy "student_unit_progress select own org"
  on public.student_unit_progress for select
  to authenticated
  using (
    exists (
      select 1
      from public.student_curricula sc
      join public.students s on s.id = sc.student_id
      where sc.id = student_unit_progress.student_curriculum_id
        and s.organization_id = public.current_organization_id()
    )
  );

create policy "student_unit_progress insert own org"
  on public.student_unit_progress for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.student_curricula sc
      join public.students s on s.id = sc.student_id
      where sc.id = student_unit_progress.student_curriculum_id
        and s.organization_id = public.current_organization_id()
    )
  );

create policy "student_unit_progress update own org"
  on public.student_unit_progress for update
  to authenticated
  using (
    exists (
      select 1
      from public.student_curricula sc
      join public.students s on s.id = sc.student_id
      where sc.id = student_unit_progress.student_curriculum_id
        and s.organization_id = public.current_organization_id()
    )
  )
  with check (
    exists (
      select 1
      from public.student_curricula sc
      join public.students s on s.id = sc.student_id
      where sc.id = student_unit_progress.student_curriculum_id
        and s.organization_id = public.current_organization_id()
    )
  );

create policy "student_unit_progress delete own org"
  on public.student_unit_progress for delete
  to authenticated
  using (
    exists (
      select 1
      from public.student_curricula sc
      join public.students s on s.id = sc.student_id
      where sc.id = student_unit_progress.student_curriculum_id
        and s.organization_id = public.current_organization_id()
    )
  );

------------------------------------------------------------------------
-- lesson_units
-- M2M veza čas ↔ unit. Postavlja se kad profesor (ili AI-potvrđeno)
-- otagira čas sa pokrivenim temama. Faza 2.
------------------------------------------------------------------------

create table public.lesson_units (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  unit_id uuid not null references public.curriculum_units (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lesson_id, unit_id)
);

create index lesson_units_unit_idx
  on public.lesson_units (unit_id);

alter table public.lesson_units enable row level security;

create policy "lesson_units select own org"
  on public.lesson_units for select
  to authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_units.lesson_id
        and l.organization_id = public.current_organization_id()
    )
  );

create policy "lesson_units insert own org"
  on public.lesson_units for insert
  to authenticated
  with check (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_units.lesson_id
        and l.organization_id = public.current_organization_id()
    )
  );

create policy "lesson_units delete own org"
  on public.lesson_units for delete
  to authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_units.lesson_id
        and l.organization_id = public.current_organization_id()
    )
  );
