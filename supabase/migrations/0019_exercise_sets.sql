-- AI-generated exercise sets (banka zadataka).
-- Each row is one set generated for a topic + grade + difficulty.

create table public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,

  -- Metadata used for filtering / display.
  title text not null,
  subject text not null default 'matematika' check (subject in ('matematika')),
  grade_level text not null,           -- npr. "8. razred OŠ", "2. razred SŠ"
  topic text not null,                 -- npr. "Kvadratne jednačine"
  difficulty text not null check (difficulty in ('lako', 'srednje', 'tesko', 'mesano')),
  count integer not null check (count between 1 and 30),

  -- Generation inputs (kept for "regenerate similar" later).
  teacher_notes text,
  prompt_used text,

  -- Generated payload: array of { question, solution, explanation }.
  exercises jsonb not null default '[]'::jsonb,

  -- Telemetry for cost tracking.
  model text not null default 'claude-sonnet-4-6',
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_creation_tokens integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index exercise_sets_organization_id_idx
  on public.exercise_sets (organization_id, created_at desc)
  where deleted_at is null;

create index exercise_sets_topic_idx
  on public.exercise_sets (organization_id, topic)
  where deleted_at is null;

create trigger exercise_sets_set_updated_at
before update on public.exercise_sets
for each row execute function public.set_updated_at();

alter table public.exercise_sets enable row level security;

create policy "exercise_sets select own org"
on public.exercise_sets for select
to authenticated
using (organization_id = public.current_organization_id() and deleted_at is null);

create policy "exercise_sets insert own org"
on public.exercise_sets for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "exercise_sets update own org"
on public.exercise_sets for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());
