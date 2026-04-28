-- Additional tag categories on public profile.

alter table public.public_profiles
  add column levels text[] not null default '{}',
  add column specialties text[] not null default '{}',
  add column formats text[] not null default '{}',
  add column years_experience text;
