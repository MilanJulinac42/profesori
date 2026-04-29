-- Section ordering & visibility per profile.
-- Stored as ordered JSON array of { type, visible } objects.
-- Hero and Booking are always rendered and not stored here.

alter table public.public_profiles
  add column sections jsonb not null default '[]'::jsonb;
