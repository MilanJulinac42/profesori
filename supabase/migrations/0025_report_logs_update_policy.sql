-- RLS UPDATE policy za report_logs.
-- Bez ovoga, upsert (Pregled → Regeneriši) pada sa "new row violates RLS"
-- kada već postoji red za isti period.

drop policy if exists "report_logs update own org" on public.report_logs;

create policy "report_logs update own org"
on public.report_logs for update
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());
