"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";

export async function regenerateParentLinkAction(
  studentId: string,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  try {
    await requireUser();
    const supabase = await createClient();

    const newToken = randomBytes(16).toString("hex");

    const { error } = await supabase
      .from("students")
      .update({
        parent_portal_token: newToken,
        parent_portal_token_created_at: new Date().toISOString(),
        parent_portal_revoked_at: null,
      })
      .eq("id", studentId);

    if (error) return { ok: false, error: error.message };
    revalidatePath(`/students/${studentId}`);
    return { ok: true, token: newToken };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}
