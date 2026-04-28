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
import { getLastReminderByStudent } from "@/lib/reminders/queries";
import { requireUser } from "@/lib/supabase/auth";
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

  const [
    { totalDebt, totalCredit, debtors },
    analytics,
    recentPayments,
    { profile: teacherProfile },
  ] = await Promise.all([
    getOrgDebtors(supabase),
    getBillingAnalytics(supabase, range),
    getRecentPayments(supabase, 8),
    requireUser(),
  ]);

  // Last reminder map for debtor rows.
  const lastReminders = await getLastReminderByStudent(
    supabase,
    debtors.map((d) => d.student_id),
  );
  const debtorsWithLastReminder = debtors.map((d) => ({
    ...d,
    lastReminderAt: lastReminders.get(d.student_id)?.sent_at ?? null,
  }));

  // Build student list for the picker (all active + currently-debt students).
  const { data: allStudents } = await supabase
    .from("students")
    .select("id, full_name, parent_name, parent_phone, parent_email")
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  const debtMap = new Map(debtors.map((d) => [d.student_id, d.debt]));
  const pickerStudents = (
    allStudents as
      | {
          id: string;
          full_name: string;
          parent_name: string | null;
          parent_phone: string | null;
          parent_email: string | null;
        }[]
      | null ?? []
  ).map((s) => ({
    id: s.id,
    full_name: s.full_name,
    parent_name: s.parent_name,
    parent_phone: s.parent_phone,
    parent_email: s.parent_email,
    debt: debtMap.get(s.id) ?? 0,
  }));

  return (
    <BillingClient
      period={period}
      periodLabel={PERIOD_LABELS[period]}
      analytics={analytics}
      totalDebt={totalDebt}
      totalCredit={totalCredit}
      debtors={debtorsWithLastReminder}
      recentPayments={recentPayments}
      pickerStudents={pickerStudents}
      teacherName={teacherProfile.full_name ?? "Profesor"}
    />
  );
}
