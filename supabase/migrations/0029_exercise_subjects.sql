-- Proširenje exercise_sets.subject — pored matematike dozvoljavamo
-- fiziku, hemiju, srpski, engleski. Drop old check, dodaj novi.

alter table public.exercise_sets
  drop constraint if exists exercise_sets_subject_check;

alter table public.exercise_sets
  add constraint exercise_sets_subject_check
    check (
      subject in (
        'matematika',
        'fizika',
        'hemija',
        'srpski',
        'engleski'
      )
    );
