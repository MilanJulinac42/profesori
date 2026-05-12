-- Dashboard "Postavi platformu" kartica — kad je user kliknuo "Sakrij".
-- Null = nije sakrio; timestamp = sakrio (kartica se više ne prikazuje).
-- Razlikuje se od onboarding_completed_at (intro tour) — ovo je samostalno
-- dismissable widget na dashboard-u.

alter table public.users
  add column dashboard_setup_dismissed_at timestamptz;
