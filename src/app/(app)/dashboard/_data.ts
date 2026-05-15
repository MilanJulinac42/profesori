import { cache } from "react";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getLessonAnalytics,
  getRangeForPeriod,
  type AnalyticsPeriod,
} from "@/lib/analytics/queries";
import { getOrgSettings } from "@/lib/settings/queries";
import { computeBillableStatuses } from "@/lib/payments/types";

export const getDashboardUser = cache(async () => {
  return requireUser();
});

export const getDashboardSupabase = cache(async () => {
  return createClient();
});

export const getDashboardAnalytics = cache(
  async (period: AnalyticsPeriod) => {
    const supabase = await getDashboardSupabase();
    const range = getRangeForPeriod(period);
    return getLessonAnalytics(supabase, range, { period });
  },
);

export const getDashboardBillableStatuses = cache(async () => {
  const supabase = await getDashboardSupabase();
  const { profile } = await getDashboardUser();
  const org = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;
  const settings = await getOrgSettings(supabase, org!.id);
  return computeBillableStatuses(settings);
});
