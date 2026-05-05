-- Recurrence groups za ponavljajuće časove.
-- Svi časovi koji su kreirani odjednom kroz "Ponovi" UI dele isti recurrence_group_id.
-- Solo časovi imaju NULL.

alter table public.lessons
  add column recurrence_group_id uuid;

create index lessons_recurrence_group_idx
  on public.lessons (recurrence_group_id)
  where recurrence_group_id is not null and deleted_at is null;
