"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { getParentSession } from "@/lib/parent-portal/auth";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/** Roditelj ostavlja komentar (preko portala — service role + token validation). */
export async function addParentCommentAction(input: {
  reportLogId: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getParentSession();
    if (!session) return { ok: false, error: "Sesija je istekla." };

    const body = input.body.trim();
    if (!body) return { ok: false, error: "Komentar ne može biti prazan." };
    if (body.length > 2000)
      return { ok: false, error: "Komentar je predugačak (max 2000)." };

    const supabase = getServiceClient();

    // Validacija — report mora pripadati ovom učeniku
    const { data: report } = await supabase
      .from("report_logs")
      .select("id, student_id, organization_id")
      .eq("id", input.reportLogId)
      .maybeSingle();

    if (!report || report.student_id !== session.studentId) {
      return { ok: false, error: "Izveštaj nije pronađen." };
    }

    const { error } = await supabase.from("report_comments").insert({
      report_log_id: input.reportLogId,
      student_id: session.studentId,
      organization_id: report.organization_id,
      author: "parent",
      body,
    });

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/reports/${input.reportLogId}`);
    revalidatePath(`/students/${session.studentId}`);
    revalidatePath("/dashboard");
    revalidatePath("/r");

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}

/** Profesor označava komentar kao pročitan. */
export async function markCommentReadAction(
  commentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("report_comments")
      .update({ read_by_teacher_at: new Date().toISOString() })
      .eq("id", commentId)
      .is("read_by_teacher_at", null);

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
