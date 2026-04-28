-- Portfolio extensions: social links, qualifications, experiences,
-- testimonials, languages, intro video.

alter table public.public_profiles
  add column links jsonb not null default '[]'::jsonb,
  add column languages text[] not null default '{}',
  add column intro_video_url text,
  add column qualifications jsonb not null default '[]'::jsonb,
  add column experiences jsonb not null default '[]'::jsonb,
  add column testimonials jsonb not null default '[]'::jsonb,
  add column location text;
