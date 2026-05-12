"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";

/**
 * Sakriva "Postavi platformu" karticu na dashboard-u (per-user, DB-backed
 * da se odluka primeni na svim uređajima istog profesora).
 */
export async function dismissDashboardSetupAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("users")
      .update({ dashboard_setup_dismissed_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}
