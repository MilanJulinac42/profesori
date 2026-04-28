-- Add per-student default lesson duration.

alter table public.students
  add column default_lesson_duration_minutes integer not null default 60
    check (default_lesson_duration_minutes > 0);
