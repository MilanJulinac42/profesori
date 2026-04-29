-- Pricing packages section (e.g. "Mesečna karta", "Priprema za maturu").
-- Stored as ordered JSON array.

alter table public.public_profiles
  add column pricing_packages jsonb not null default '[]'::jsonb;
