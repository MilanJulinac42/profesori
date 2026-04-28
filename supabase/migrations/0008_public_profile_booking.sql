-- Public profile (visible at /p/{slug}) and booking requests inbox.

create table public.public_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  slug text not null unique,
  display_name text not null,
  bio text,
  subjects text[] not null default '{}',
  price_range_text text,
  available_for_new_students boolean not null default true,
  contact_email text,
  photo_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index public_profiles_published_slug_idx
  on public.public_profiles (slug)
  where published = true;

create trigger public_profiles_set_updated_at
before update on public.public_profiles
for each row execute function public.set_updated_at();

alter table public.public_profiles enable row level security;

-- Anyone (anon + authenticated) can read PUBLISHED profiles.
create policy "public_profiles public read"
on public.public_profiles for select
to anon, authenticated
using (published = true);

-- Owners can read their own profile (even when not published).
create policy "public_profiles owner select"
on public.public_profiles for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "public_profiles owner insert"
on public.public_profiles for insert
to authenticated
with check (organization_id = public.current_organization_id());

create policy "public_profiles owner update"
on public.public_profiles for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

-- Booking requests inbox.
create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  parent_name text not null,
  parent_phone text,
  parent_email text,
  student_grade text,
  subject text,
  message text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'converted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index booking_requests_org_status_idx
  on public.booking_requests (organization_id, status, created_at desc);

create trigger booking_requests_set_updated_at
before update on public.booking_requests
for each row execute function public.set_updated_at();

alter table public.booking_requests enable row level security;

-- Public can submit a booking ONLY to orgs with a published profile.
create policy "booking_requests public insert"
on public.booking_requests for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.public_profiles pp
    where pp.organization_id = booking_requests.organization_id
      and pp.published = true
  )
);

create policy "booking_requests owner select"
on public.booking_requests for select
to authenticated
using (organization_id = public.current_organization_id());

create policy "booking_requests owner update"
on public.booking_requests for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());
