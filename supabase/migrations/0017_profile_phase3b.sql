-- Phase 3b additions: FAQ, gallery, video autoplay toggle, office hours.

alter table public.public_profiles
  add column faq_items jsonb not null default '[]'::jsonb,
  add column gallery_images jsonb not null default '[]'::jsonb,
  add column intro_video_autoplay boolean not null default false,
  add column office_hours jsonb;
