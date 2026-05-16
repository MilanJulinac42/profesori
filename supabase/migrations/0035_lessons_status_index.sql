-- Composite index for status-filtered lesson queries.
--
-- Existing indexes cover (org, scheduled_at) and (student, scheduled_at).
-- This adds (org, status, scheduled_at) which serves several hot paths:
--   - Dashboard "Sledeći časovi"   : status='scheduled' AND scheduled_at >= now()
--   - Dashboard "Bez beleške"      : status='completed' (+ notes filter)
--   - Debtors                      : status IN (billable)
--   - Activity feed lessons        : status IN (completed, cancelled_*, no_show)
--   - Analytics by-status counts   : status IN (...) within a date window
--
-- Cost: small storage + write overhead on lessons. Read-side wins are large
-- once a teacher accumulates a few hundred lessons.
--
-- The existing (org, scheduled_at) index is kept because analytics' main
-- fetch does NOT filter by status (it aggregates all statuses in a date
-- range) and would still need the lighter two-column index.

create index lessons_org_status_scheduled_idx
  on public.lessons (organization_id, status, scheduled_at)
  where deleted_at is null;
