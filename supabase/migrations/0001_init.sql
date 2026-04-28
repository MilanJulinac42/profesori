-- Initial schema: organizations, users (profiles), and signup trigger.

create extension if not exists "pgcrypto";

-- Organizations (tenants). Solo profesor = org with one member.
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  subscription_tier text not null default 'start' check (subscription_tier in ('start', 'pro', 'master')),
  subscription_status text not null default 'trialing' check (subscription_status in ('trialing', 'active', 'past_due', 'cancelled')),
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index organizations_slug_idx on public.organizations (slug) where deleted_at is null;

-- Users profile, 1:1 with auth.users.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index users_organization_id_idx on public.users (organization_id);

-- updated_at trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- Fallback unaccent without the unaccent extension (best-effort latin transliteration).
create or replace function public.unaccent_safe(input text)
returns text
language sql
immutable
as $$
  select translate(
    input,
    'ČčĆćŠšĐđŽžÀàÁáÂâÃãÄäÅåÇçÈèÉéÊêËëÌìÍíÎîÏïÒòÓóÔôÕõÖöÙùÚúÛûÜüÝýÑñ',
    'CcCcSsDdZzAaAaAaAaAaAaCcEeEeEeEeIiIiIiIiOoOoOoOoOoUuUuUuUuYyNn'
  );
$$;

-- Slug helper: lowercase, ascii, dashes. Naive but enough for MVP; uniqueness is enforced separately.
create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    regexp_replace(
      lower(public.unaccent_safe(coalesce(input, ''))),
      '[^a-z0-9]+', '-', 'g'
    ),
    '(^-+|-+$)', '', 'g'
  );
$$;

-- Ensure unique slug by appending numeric suffix on collision.
create or replace function public.unique_slug(base text)
returns text
language plpgsql
as $$
declare
  candidate text;
  suffix int := 0;
begin
  candidate := nullif(public.slugify(base), '');
  if candidate is null then
    candidate := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  end if;
  while exists (select 1 from public.organizations where slug = candidate) loop
    suffix := suffix + 1;
    candidate := public.slugify(base) || '-' || suffix;
  end loop;
  return candidate;
end;
$$;

-- On new auth.users row, create org + profile.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  display_name text;
  org_slug text;
begin
  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  org_slug := public.unique_slug(display_name);

  insert into public.organizations (name, slug, trial_ends_at)
  values (display_name, org_slug, now() + interval '14 days')
  returning id into new_org_id;

  insert into public.users (id, email, full_name, organization_id, role)
  values (new.id, new.email, display_name, new_org_id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Row-Level Security.
alter table public.organizations enable row level security;
alter table public.users enable row level security;

-- Helper: organization_id of currently authenticated user.
create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.users where id = auth.uid() and deleted_at is null limit 1;
$$;

create policy "users select own org"
on public.organizations for select
to authenticated
using (id = public.current_organization_id() and deleted_at is null);

create policy "users update own org"
on public.organizations for update
to authenticated
using (id = public.current_organization_id())
with check (id = public.current_organization_id());

create policy "users select own profile row"
on public.users for select
to authenticated
using (organization_id = public.current_organization_id() and deleted_at is null);

create policy "users update own profile row"
on public.users for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());
