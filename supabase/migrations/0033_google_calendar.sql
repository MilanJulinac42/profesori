-- Google Calendar integracija — OAuth tokens + per-lesson event mapping.

create table public.google_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,

  -- OAuth tokens
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,

  -- Scope-ovi koje smo dobili (komaa-separated)
  scope text not null,

  -- Korisnikov Google email (za prikaz "povezano sa marko@gmail.com")
  google_email text,

  -- ID kalendara koji se koristi za sync. Default 'primary'; korisnik bira.
  calendar_id text not null default 'primary',
  calendar_name text,

  -- Sync state — koristi se za incremental pull (Phase 2)
  sync_token text,
  last_synced_at timestamptz,

  -- Push notification (webhook) state — Phase 3
  watch_channel_id text,
  watch_resource_id text,
  watch_expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index google_connections_org_idx
  on public.google_connections (organization_id);

create trigger google_connections_set_updated_at
  before update on public.google_connections
  for each row
  execute function public.set_updated_at();

-- Po lessonu: ID Google Calendar event-a koji ga reprezentuje.
alter table public.lessons
  add column google_event_id text,
  add column google_synced_at timestamptz;

create index lessons_google_event_idx
  on public.lessons (google_event_id)
  where google_event_id is not null;

-- RLS
alter table public.google_connections enable row level security;

create policy "google_connections select own org"
  on public.google_connections for select
  to authenticated
  using (organization_id = public.current_organization_id());

create policy "google_connections insert own org"
  on public.google_connections for insert
  to authenticated
  with check (organization_id = public.current_organization_id());

create policy "google_connections update own org"
  on public.google_connections for update
  to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "google_connections delete own org"
  on public.google_connections for delete
  to authenticated
  using (organization_id = public.current_organization_id());
