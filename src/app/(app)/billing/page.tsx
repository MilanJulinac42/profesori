import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import {
  getOrgDebtors,
  getBillingAnalytics,
  getRecentPayments,
} from "@/lib/payments/queries";
import {
  getRangeForPeriod,
  PERIOD_LABELS,
  type AnalyticsPeriod,
} from "@/lib/analytics/queries";
import { BillingClient } from "./_components/billing-client";

type Search = { period?: string };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const period: AnalyticsPeriod = (
    ["week", "month", "30d", "all"].includes(params.period ?? "")
      ? params.period
      : "month"
  ) as AnalyticsPeriod;
  const range = getRangeForPeriod(period);

  const [{ totalDebt, totalCredit, debtors }, analytics, recentPayments] =
    await Promise.all([
      getOrgDebtors(supabase),
      getBillingAnalytics(supabase, range),
      getRecentPayments(supabase, 8),
    ]);

  // Build student list for the picker (all active + currently-debt students).
  const { data: allStudents } = await supabase
    .from("students")
    .select("id, full_name")
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  const debtMap = new Map(debtors.map((d) => [d.student_id, d.debt]));
  const pickerStudents = (allStudents ?? []).map((s) => ({
    id: s.id,
    full_name: s.full_name,
    debt: debtMap.get(s.id) ?? 0,
  }));

  return (
    <BillingClient
      period={period}
      periodLabel={PERIOD_LABELS[period]}
      analytics={analytics}
      totalDebt={totalDebt}
      totalCredit={totalCredit}
      debtors={debtors}
      recentPayments={recentPayments}
      pickerStudents={pickerStudents}
    />
  );
}
