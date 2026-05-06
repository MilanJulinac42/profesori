-- Reports: cached drafts per period
--
-- Background: do sada smo svaki klik "Pregled" tretirali kao novu
-- generaciju (Anthropic poziv) i nismo upisivali ništa dok nije kliknut
-- "Pošalji". Sada želimo:
--   - jedan red po (student, kind, period_start) — bez obzira na status
--   - "Pregled" upisuje DRAFT (ako ne postoji) ili vraća keširani
--   - "Regeneriši" overrajduje istu draft (nova verzija)
--   - "Pošalji" → status='sent', upisuje email + sent_at
--
-- Migracija:
--   1. dodaj 'draft' u status check
--   2. recipient_email postaje nullable (draft ne mora email)
--   3. drop unique index gde status='sent' → novi unique index BEZ filtera
--      (jedan red po periodu, period bez obzira na status)
--   4. dodaj updated_at sa trigger-om

-- 1) Status check: dodaj 'draft'
alter table public.report_logs
  drop constraint report_logs_status_check;

alter table public.report_logs
  add constraint report_logs_status_check
    check (status in ('sent', 'failed', 'preview', 'draft'));

-- 2) recipient_email nullable
alter table public.report_logs
  alter column recipient_email drop not null;

-- 3) Unique index bez status filtera — jedan red po (student, kind, period_start)
drop index if exists report_logs_unique_period_idx;

create unique index report_logs_unique_period_idx
  on public.report_logs (student_id, kind, period_start);

-- 4) updated_at + trigger
alter table public.report_logs
  add column updated_at timestamptz not null default now();

create or replace function public.set_report_logs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger report_logs_set_updated_at
  before update on public.report_logs
  for each row
  execute function public.set_report_logs_updated_at();

-- 5) UPDATE policy — upsert pri regeneraciji (drop + ponovo ako negde već postoji)
drop policy if exists "report_logs update own org" on public.report_logs;

create policy "report_logs update own org"
on public.report_logs for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());
