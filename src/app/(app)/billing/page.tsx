import { createClient } from "@/lib/supabase/server";
import {
  getOrgDebtors,
  getBillingAnalytics,
  getRecentPayments,
} from "@/lib/payments/queries";
import { computeBillableStatuses } from "@/lib/payments/types";
import {
  getRangeForPeriod,
  PERIOD_LABELS,
  type AnalyticsPeriod,
} from "@/lib/analytics/queries";
import { getLastReminderByStudent } from "@/lib/reminders/queries";
import { getOrgSettings } from "@/lib/settings/queries";
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

  const { profile: teacherProfile } = await requireUser();
  const teacherOrg = Array.isArray(teacherProfile.organizations)
    ? teacherProfile.organizations[0]
    : teacherProfile.organizations;
  const settings = await getOrgSettings(supabase, teacherOrg!.id);
  const billableStatuses = computeBillableStatuses(settings);

  const [
    { totalDebt, totalCredit, debtors },
    analytics,
    recentPayments,
  ] = await Promise.all([
    getOrgDebtors(supabase, billableStatuses),
    getBillingAnalytics(supabase, range, billableStatuses),
    getRecentPayments(supabase, 8),
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

  // Build student list for the picker.
  const { data: allStudents } = await supabase
    .from("students")
    .select("id, full_name, parent_name, parent_phone, parent_email")
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  const debtMap = new Map(debtors.map((d) => [d.student_id, d.debt]));
  const pickerStudents = (
    (allStudents as
      | {
          id: string;
          full_name: string;
          parent_name: string | null;
          parent_phone: string | null;
          parent_email: string | null;
        }[]
      | null) ?? []
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
      customTemplate={settings.reminder_template ?? null}
    />
  );
}
