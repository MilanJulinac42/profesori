-- Extra fields for post-lesson notes.
-- notes_after_lesson and topics_covered already exist on lessons (0003).
-- This adds rating and next-lesson-plan.

alter table public.lessons
  add column lesson_rating smallint
    check (lesson_rating is null or lesson_rating between 1 and 5),
  add column next_lesson_plan text;
