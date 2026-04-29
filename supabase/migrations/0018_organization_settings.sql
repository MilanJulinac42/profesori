-- Organization-level settings: defaults, behaviors, custom templates.
-- Stored as flexible jsonb so we can add new keys without migrations.

alter table public.organizations
  add column settings jsonb not null default '{}'::jsonb;
