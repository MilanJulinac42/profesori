-- Roditeljski portal: per-student magic-link token.
--
-- Profesor klikne "Pošalji link roditelju" → token se kreira (ili postoji
-- već) i deli sa roditeljem preko WhatsApp/email. Roditelj klikne → cookie
-- se postavi, ima pristup portalu /r/[student_id].

alter table public.students
  add column parent_portal_token text
    default encode(gen_random_bytes(16), 'hex'),
  add column parent_portal_token_created_at timestamptz default now(),
  add column parent_portal_revoked_at timestamptz;

create unique index students_parent_portal_token_idx
  on public.students (parent_portal_token)
  where parent_portal_token is not null;
