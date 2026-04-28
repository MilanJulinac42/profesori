"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
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

/**
 * Returns a conflicting lesson if [start, start+duration) overlaps any other
 * scheduled lesson (excluding `excludeId` if provided).
 */
async function findConflict(
  supabase: SupabaseClient,
  start: Date,
  durationMinutes: number,
  excludeId: string | null = null,
): Promise<{ id: string; scheduled_at: string; duration_minutes: number } | null> {
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  // Pull a generous window (±12h) and filter precisely in JS.
  const windowStart = new Date(start.getTime() - 12 * 3600_000).toISOString();
  const windowEnd = new Date(end.getTime() + 12 * 3600_000).toISOString();

  let query = supabase
    .from("lessons")
    .select("id, scheduled_at, duration_minutes")
    .is("deleted_at", null)
    .eq("status", "scheduled")
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd);

  if (excludeId) query = query.neq("id", excludeId);

  const { data } = await query;
  for (const l of data ?? []) {
    const lStart = new Date(l.scheduled_at);
    const lEnd = new Date(lStart.getTime() + l.duration_minutes * 60_000);
    if (lStart < end && start < lEnd) return l;
  }
  return null;
}

function formatConflictMessage(c: {
  scheduled_at: string;
  duration_minutes: number;
}) {
  const dt = new Date(c.scheduled_at);
  const time = dt.toLocaleTimeString("sr-Latn-RS", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = dt.toLocaleDateString("sr-Latn-RS", {
    day: "numeric",
    month: "short",
  });
  return `Već imaš zakazan čas ${date} u ${time} (${c.duration_minutes} min). Izaberi drugo vreme.`;
}

export async function createLesson(
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const studentId = String(formData.get("student_id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const durationStr = String(formData.get("duration_minutes") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!studentId) fieldErrors.student_id = "Izaberi učenika.";
  if (!date) fieldErrors.date = "Datum je obavezan.";
  if (!time) fieldErrors.time = "Vreme je obavezno.";

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const scheduledAt = new Date(`${date}T${time}:00`);
  if (isNaN(scheduledAt.getTime())) {
    return { fieldErrors: { date: "Neispravan datum/vreme." } };
  }

  const { supabase, orgId } = await getOrgId();
  if (!orgId) return { error: "Niste prijavljeni." };

  // Pull student to fill defaults if needed.
  const { data: student } = await supabase
    .from("students")
    .select("default_price_per_lesson, default_lesson_duration_minutes")
    .eq("id", studentId)
    .single();
  if (!student) return { fieldErrors: { student_id: "Učenik nije pronađen." } };

  let duration = Number(durationStr);
  if (!durationStr || !Number.isFinite(duration) || duration <= 0) {
    duration = student.default_lesson_duration_minutes ?? 60;
  }

  let pricePara: number;
  if (priceRaw) {
    const parsed = parseRsdInput(priceRaw);
    if (parsed === null) return { fieldErrors: { price: "Cena mora biti broj." } };
    pricePara = parsed;
  } else {
    pricePara = student.default_price_per_lesson ?? 0;
  }

  const conflict = await findConflict(supabase, scheduledAt, duration);
  if (conflict) {
    return { fieldErrors: { time: formatConflictMessage(conflict) } };
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

  const conflict = await findConflict(supabase, scheduledAt, duration, lessonId);
  if (conflict) {
    return { fieldErrors: { time: formatConflictMessage(conflict) } };
  }

  // Look up student for revalidation before update.
  const { data: existing } = await supabase
    .from("lessons")
    .select("student_id")
    .eq("id", lessonId)
    .single();

  const update: Record<string, unknown> = {
    scheduled_at: scheduledAt.toISOString(),
    duration_minutes: duration,
  };
  if (pricePara !== null) update.price = pricePara;

  const { error } = await supabase.from("lessons").update(update).eq("id", lessonId);
  if (error) return { error: error.message };

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  if (existing?.student_id) revalidatePath(`/students/${existing.student_id}`);
  return undefined;
}

export async function setLessonStatus(lessonId: string, status: LessonStatus) {
  const { supabase } = await getOrgId();

  const { data: existing } = await supabase
    .from("lessons")
    .select("student_id")
    .eq("id", lessonId)
    .single();

  const { error } = await supabase
    .from("lessons")
    .update({ status })
    .eq("id", lessonId);
  if (error) throw new Error(error.message);

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  if (existing?.student_id) revalidatePath(`/students/${existing.student_id}`);
}

export async function deleteLesson(lessonId: string) {
  const { supabase } = await getOrgId();

  // Read student_id BEFORE we set deleted_at (after that, RLS hides the row).
  const { data: existing } = await supabase
    .from("lessons")
    .select("student_id")
    .eq("id", lessonId)
    .single();

  const { error } = await supabase
    .from("lessons")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", lessonId);
  if (error) throw new Error(error.message);

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  if (existing?.student_id) revalidatePath(`/students/${existing.student_id}`);
}
