-- Phone number for the public profile (used by WhatsApp / Viber / tel: links).

alter table public.public_profiles
  add column contact_phone text;
