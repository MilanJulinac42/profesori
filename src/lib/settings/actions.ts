"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseRsdInput } from "@/lib/money";
import { DEFAULT_SETTINGS, type OrgSettings } from "./types";

export type FormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
} | undefined;

async function getCtx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, orgId: null as string | null };
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  return {
    supabase,
    user,
    orgId: profile?.organization_id ?? null,
  };
}

/* ---------------- Personal info ---------------- */

export async function updatePersonalInfo(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim() || null;

  if (!fullName) {
    return { fieldErrors: { full_name: "Ime je obavezno." } };
  }

  const { supabase, user } = await getCtx();
  if (!user) return { error: "Niste prijavljeni." };

  const { error } = await supabase
    .from("users")
    .update({ full_name: fullName, phone, avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

/* ---------------- Password change ---------------- */

export async function changePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const newPassword = String(formData.get("new_password") ?? "");
  if (newPassword.length < 8) {
    return {
      fieldErrors: { new_password: "Lozinka mora imati najmanje 8 karaktera." },
    };
  }

  const { supabase } = await getCtx();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  return { success: true };
}

/* ---------------- Org settings ---------------- */

export async function updateOrgSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, orgId } = await getCtx();
  if (!orgId) return { error: "Niste prijavljeni." };

  const priceRaw = String(formData.get("default_price_per_lesson") ?? "").trim();
  const durationRaw = String(
    formData.get("default_lesson_duration_minutes") ?? "",
  ).trim();
  const chargeStudent =
    String(formData.get("charge_for_cancelled_by_student") ?? "") === "on";
  const chargeNoShow =
    String(formData.get("charge_for_no_show") ?? "") === "on";
  const reminderTemplate =
    String(formData.get("reminder_template") ?? "").trim() || undefined;
  const autoReminders =
    String(formData.get("send_automatic_reminders") ?? "") === "on";

  const fieldErrors: Record<string, string> = {};
  let priceP: number | undefined;
  if (priceRaw) {
    const parsed = parseRsdInput(priceRaw);
    if (parsed === null || parsed <= 0)
      fieldErrors.default_price_per_lesson = "Cena mora biti pozitivan broj.";
    else priceP = parsed;
  }
  let durationN: number | undefined;
  if (durationRaw) {
    const n = Number(durationRaw);
    if (!Number.isFinite(n) || n <= 0 || n > 480)
      fieldErrors.default_lesson_duration_minutes =
        "Trajanje mora biti broj 1–480.";
    else durationN = Math.round(n);
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const next: OrgSettings = {
    default_price_per_lesson: priceP ?? DEFAULT_SETTINGS.default_price_per_lesson,
    default_lesson_duration_minutes:
      durationN ?? DEFAULT_SETTINGS.default_lesson_duration_minutes,
    charge_for_cancelled_by_student: chargeStudent,
    charge_for_no_show: chargeNoShow,
    reminder_template: reminderTemplate,
    send_automatic_reminders: autoReminders,
  };

  const { error } = await supabase
    .from("organizations")
    .update({ settings: next })
    .eq("id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

/* ---------------- GDPR data export ---------------- */

export async function exportOrgData() {
  const { supabase, orgId } = await getCtx();
  if (!orgId) throw new Error("Niste prijavljeni.");

  const [
    { data: organization },
    { data: users },
    { data: students },
    { data: lessons },
    { data: payments },
    { data: reminderLogs },
    { data: bookingRequests },
    { data: publicProfile },
  ] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", orgId).single(),
    supabase.from("users").select("*").eq("organization_id", orgId),
    supabase.from("students").select("*").eq("organization_id", orgId),
    supabase.from("lessons").select("*").eq("organization_id", orgId),
    supabase.from("payments").select("*").eq("organization_id", orgId),
    supabase
      .from("reminder_logs")
      .select("*")
      .eq("organization_id", orgId),
    supabase
      .from("booking_requests")
      .select("*")
      .eq("organization_id", orgId),
    supabase
      .from("public_profiles")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle(),
  ]);

  return {
    exported_at: new Date().toISOString(),
    organization,
    users,
    students,
    lessons,
    payments,
    reminder_logs: reminderLogs,
    booking_requests: bookingRequests,
    public_profile: publicProfile,
  };
}

/* ---------------- Account deletion ---------------- */

export async function deleteAccount() {
  const { user, orgId } = await getCtx();
  if (!user || !orgId) throw new Error("Niste prijavljeni.");

  // Use the admin client to delete the auth user. The cascade on
  // public.users.id (FK to auth.users) will remove the profile row, and the
  // ON DELETE CASCADE chain on organization_id will sweep students, lessons,
  // payments, reminder_logs, booking_requests, public_profiles too.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(error.message);

  redirect("/");
}
