"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseRsdInput } from "@/lib/money";
import type { LessonStatus } from "./types";

export type LessonFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
} | undefined;

async function getOrgId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, orgId: null as string | null };
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  return { supabase, orgId: profile?.organization_id ?? null };
}

export async function createLesson(
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const studentId = String(formData.get("student_id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim(); // YYYY-MM-DD
  const time = String(formData.get("time") ?? "").trim(); // HH:MM
  const durationStr = String(formData.get("duration_minutes") ?? "60").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!studentId) fieldErrors.student_id = "Izaberi učenika.";
  if (!date) fieldErrors.date = "Datum je obavezan.";
  if (!time) fieldErrors.time = "Vreme je obavezno.";

  const duration = Number(durationStr);
  if (!Number.isFinite(duration) || duration <= 0) {
    fieldErrors.duration_minutes = "Trajanje mora biti broj veći od 0.";
  }

  let pricePara = 0;
  if (priceRaw) {
    const parsed = parseRsdInput(priceRaw);
    if (parsed === null) fieldErrors.price = "Cena mora biti broj.";
    else pricePara = parsed;
  }

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const scheduledAt = new Date(`${date}T${time}:00`);
  if (isNaN(scheduledAt.getTime())) {
    return { fieldErrors: { date: "Neispravan datum/vreme." } };
  }

  const { supabase, orgId } = await getOrgId();
  if (!orgId) return { error: "Niste prijavljeni." };

  // If price not entered, use student's default.
  if (!priceRaw) {
    const { data: student } = await supabase
      .from("students")
      .select("default_price_per_lesson")
      .eq("id", studentId)
      .single();
    pricePara = student?.default_price_per_lesson ?? 0;
  }

  const { error } = await supabase.from("lessons").insert({
    organization_id: orgId,
    student_id: studentId,
    scheduled_at: scheduledAt.toISOString(),
    duration_minutes: duration,
    price: pricePara,
    status: "scheduled",
  });

  if (error) return { error: error.message };

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath(`/students/${studentId}`);
  return undefined;
}

export async function updateLesson(
  lessonId: string,
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const durationStr = String(formData.get("duration_minutes") ?? "60").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!date) fieldErrors.date = "Datum je obavezan.";
  if (!time) fieldErrors.time = "Vreme je obavezno.";
  const duration = Number(durationStr);
  if (!Number.isFinite(duration) || duration <= 0) {
    fieldErrors.duration_minutes = "Trajanje mora biti broj veći od 0.";
  }
  let pricePara: number | null = null;
  if (priceRaw) {
    const parsed = parseRsdInput(priceRaw);
    if (parsed === null) fieldErrors.price = "Cena mora biti broj.";
    else pricePara = parsed;
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const scheduledAt = new Date(`${date}T${time}:00`);
  if (isNaN(scheduledAt.getTime())) {
    return { fieldErrors: { date: "Neispravan datum/vreme." } };
  }

  const { supabase } = await getOrgId();
  const update: Record<string, unknown> = {
    scheduled_at: scheduledAt.toISOString(),
    duration_minutes: duration,
  };
  if (pricePara !== null) update.price = pricePara;

  const { error, data } = await supabase
    .from("lessons")
    .update(update)
    .eq("id", lessonId)
    .select("student_id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  if (data?.student_id) revalidatePath(`/students/${data.student_id}`);
  return undefined;
}

export async function setLessonStatus(lessonId: string, status: LessonStatus) {
  const { supabase } = await getOrgId();
  const { data, error } = await supabase
    .from("lessons")
    .update({ status })
    .eq("id", lessonId)
    .select("student_id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  if (data?.student_id) revalidatePath(`/students/${data.student_id}`);
}

export async function deleteLesson(lessonId: string) {
  const { supabase } = await getOrgId();
  const { data, error } = await supabase
    .from("lessons")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", lessonId)
    .select("student_id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  if (data?.student_id) revalidatePath(`/students/${data.student_id}`);
}
