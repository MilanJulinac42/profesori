"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseRsdInput } from "@/lib/money";
import type { ReportAudience, StudentStatus } from "./types";

export type StudentFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
} | undefined;

function readFormPayload(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim() || null;
  const school = String(formData.get("school") ?? "").trim() || null;
  const parentName = String(formData.get("parent_name") ?? "").trim() || null;
  const parentPhone = String(formData.get("parent_phone") ?? "").trim() || null;
  const parentEmail = String(formData.get("parent_email") ?? "").trim() || null;
  const studentEmail = String(formData.get("student_email") ?? "").trim() || null;
  const reportAudienceRaw = String(formData.get("report_audience") ?? "parent").trim();
  const reportAudience: ReportAudience =
    reportAudienceRaw === "student" ? "student" : "parent";
  const weeklyEnabled =
    String(formData.get("weekly_reports_enabled") ?? "") === "on";
  const monthlyEnabled =
    String(formData.get("monthly_reports_enabled") ?? "") === "on";
  const priceRaw = String(formData.get("default_price_per_lesson") ?? "").trim();
  const durationRaw = String(formData.get("default_lesson_duration_minutes") ?? "60").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const status = String(formData.get("status") ?? "active") as StudentStatus;

  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  let pricePara = 0;
  let priceError: string | undefined;
  if (priceRaw) {
    const parsed = parseRsdInput(priceRaw);
    if (parsed === null) priceError = "Cena mora biti broj.";
    else pricePara = parsed;
  }

  const duration = Number(durationRaw);
  let durationError: string | undefined;
  let durationMinutes = 60;
  if (!Number.isFinite(duration) || duration <= 0 || duration > 480) {
    durationError = "Trajanje mora biti broj između 1 i 480 minuta.";
  } else {
    durationMinutes = Math.round(duration);
  }

  return {
    fullName,
    grade,
    school,
    parentName,
    parentPhone,
    parentEmail,
    studentEmail,
    reportAudience,
    weeklyEnabled,
    monthlyEnabled,
    pricePara,
    priceError,
    durationMinutes,
    durationError,
    notes,
    tags,
    status,
  };
}

export async function createStudent(
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const data = readFormPayload(formData);

  const fieldErrors: Record<string, string> = {};
  if (!data.fullName) fieldErrors.full_name = "Ime je obavezno.";
  if (data.priceError) fieldErrors.default_price_per_lesson = data.priceError;
  if (data.durationError)
    fieldErrors.default_lesson_duration_minutes = data.durationError;
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Niste prijavljeni." };

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profil nije pronađen." };

  const { data: inserted, error } = await supabase
    .from("students")
    .insert({
      organization_id: profile.organization_id,
      full_name: data.fullName,
      grade: data.grade,
      school: data.school,
      parent_name: data.parentName,
      parent_phone: data.parentPhone,
      parent_email: data.parentEmail,
      student_email: data.studentEmail,
      report_audience: data.reportAudience,
      weekly_reports_enabled: data.weeklyEnabled,
      monthly_reports_enabled: data.monthlyEnabled,
      default_price_per_lesson: data.pricePara,
      default_lesson_duration_minutes: data.durationMinutes,
      notes: data.notes,
      tags: data.tags,
      status: data.status,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/students");
  revalidatePath("/dashboard");
  redirect(`/students/${inserted!.id}`);
}

export async function updateStudent(
  studentId: string,
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const data = readFormPayload(formData);

  const fieldErrors: Record<string, string> = {};
  if (!data.fullName) fieldErrors.full_name = "Ime je obavezno.";
  if (data.priceError) fieldErrors.default_price_per_lesson = data.priceError;
  if (data.durationError)
    fieldErrors.default_lesson_duration_minutes = data.durationError;
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({
      full_name: data.fullName,
      grade: data.grade,
      school: data.school,
      parent_name: data.parentName,
      parent_phone: data.parentPhone,
      parent_email: data.parentEmail,
      student_email: data.studentEmail,
      report_audience: data.reportAudience,
      weekly_reports_enabled: data.weeklyEnabled,
      monthly_reports_enabled: data.monthlyEnabled,
      default_price_per_lesson: data.pricePara,
      default_lesson_duration_minutes: data.durationMinutes,
      notes: data.notes,
      tags: data.tags,
      status: data.status,
    })
    .eq("id", studentId);

  if (error) return { error: error.message };

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/dashboard");
  redirect(`/students/${studentId}`);
}

export async function archiveStudent(studentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", studentId);

  if (error) throw new Error(error.message);

  revalidatePath("/students");
  revalidatePath("/dashboard");
  redirect("/students");
}
