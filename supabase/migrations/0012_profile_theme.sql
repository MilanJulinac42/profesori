-- Profile theme picker.

alter table public.public_profiles
  add column theme text not null default 'aurora'
    check (theme in ('aurora', 'minimal', 'sage', 'sunrise', 'editorial'));
