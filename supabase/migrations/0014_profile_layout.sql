-- Layout type independent from theme/palette.
-- Theme keeps controlling colors; layout controls structure.

alter table public.public_profiles
  add column layout text not null default 'stack'
    check (layout in ('stack', 'split', 'magazine', 'card'));
