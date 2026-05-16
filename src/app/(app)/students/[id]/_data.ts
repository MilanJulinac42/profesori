import { cache } from "react";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgSettings } from "@/lib/settings/queries";
import {
  computeBillableStatuses,
  type Payment,
} from "@/lib/payments/types";
import { getStudentBilling } from "@/lib/payments/queries";
import type { Lesson } from "@/lib/lessons/types";

export const getSupabase = cache(async () => createClient());

export const getTeacherCtx = cache(async () => {
  const supabase = await getSupabase();
  const { profile } = await requireUser();
  const org = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;
  const settings = await getOrgSettings(supabase, org!.id);
  return {
    teacherName: profile.full_name ?? "Profesor",
    settings,
    billableStatuses: computeBillableStatuses(settings),
  };
});

export const getStudentLessons = cache(
  async (studentId: string): Promise<Lesson[]> => {
    const supabase = await getSupabase();
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: false });
    return (data as Lesson[] | null) ?? [];
  },
);

export const getStudentBillingCached = cache(async (studentId: string) => {
  const supabase = await getSupabase();
  const { billableStatuses } = await getTeacherCtx();
  return getStudentBilling(supabase, studentId, billableStatuses);
});

export const getHomeworkCount = cache(async (studentId: string) => {
  const supabase = await getSupabase();
  const { count } = await supabase
    .from("homework")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .is("deleted_at", null);
  return count ?? 0;
});

export const getReportsCount = cache(async (studentId: string) => {
  const supabase = await getSupabase();
  const { count } = await supabase
    .from("report_logs")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId);
  return count ?? 0;
});

export type StudentPayments = Payment[];
