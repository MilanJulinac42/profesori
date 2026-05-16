"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";

export async function completeOnboardingAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("users")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}

/**
 * Save default price + duration into the org's settings JSON. Used by the
 * onboarding wizard. Idempotent — pre-existing fields are preserved.
 */
export async function saveOnboardingDefaultsAction(input: {
  pricePara: number;
  durationMinutes: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();
    const orgId = profile.organization_id;

    // Fetch current settings JSON (column lives on organizations).
    const { data: org } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", orgId)
      .single();
    const current = (org?.settings as Record<string, unknown> | null) ?? {};

    const next = {
      ...DEFAULT_SETTINGS,
      ...current,
      default_price_per_lesson: input.pricePara,
      default_lesson_duration_minutes: input.durationMinutes,
    };

    const { error } = await supabase
      .from("organizations")
      .update({ settings: next })
      .eq("id", orgId);
    if (error) return { ok: false, error: error.message };

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}

/**
 * Create the first student during onboarding. Returns its id on success.
 * Minimal fields: name (required), parent name + phone optional, default
 * price/duration inherited from org settings already saved in the previous
 * step.
 */
export async function createFirstStudentAction(input: {
  fullName: string;
  parentName: string;
  parentPhone: string;
  pricePara: number;
  durationMinutes: number;
}): Promise<
  { ok: true; studentId: string } | { ok: false; error: string }
> {
  try {
    const { profile } = await requireUser();
    if (!input.fullName.trim()) {
      return { ok: false, error: "Ime je obavezno." };
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("students")
      .insert({
        organization_id: profile.organization_id,
        full_name: input.fullName.trim(),
        parent_name: input.parentName.trim() || null,
        parent_phone: input.parentPhone.trim() || null,
        default_price_per_lesson: Math.max(0, Math.round(input.pricePara)),
        default_lesson_duration_minutes: Math.max(
          5,
          Math.min(480, Math.round(input.durationMinutes)),
        ),
        status: "active",
        report_audience: "parent",
        weekly_reports_enabled: false,
        monthly_reports_enabled: false,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/students");
    revalidatePath("/dashboard");
    return { ok: true, studentId: data!.id as string };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}
