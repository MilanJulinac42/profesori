"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { LessonStatus } from "./types";

const CANCEL_REASONS: LessonStatus[] = [
  "cancelled_by_student",
  "cancelled_by_teacher",
  "no_show",
];

export type BulkCancelInput = {
  /** ISO datetimes — inclusive lower bound, exclusive upper bound. */
  fromIso: string;
  toIso: string;
  /** Final status to set; must be a cancellation/no-show variant. */
  reason: LessonStatus;
};

export type BulkRescheduleInput = {
  fromIso: string;
  toIso: string;
  /** Minutes to add to each affected lesson's scheduled_at. May be negative. */
  offsetMinutes: number;
};

export type BulkResult =
  | { ok: true; affected: number }
  | { ok: false; error: string };

const MAX_AFFECTED = 200;

function cancelReasonValid(reason: string): reason is LessonStatus {
  return (CANCEL_REASONS as string[]).includes(reason);
}

/**
 * Bulk-cancel scheduled lessons in a window. Operates only on lessons that
 * are still in "scheduled" state to avoid clobbering already-resolved ones.
 */
export async function bulkCancelLessons(
  input: BulkCancelInput,
): Promise<BulkResult> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();

    if (!cancelReasonValid(input.reason)) {
      return { ok: false, error: "Neispravan razlog otkazivanja." };
    }

    // First fetch ids in window so we can return an accurate affected count
    // and enforce the safety cap.
    const { data: targets, error: selectErr } = await supabase
      .from("lessons")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .eq("status", "scheduled")
      .gte("scheduled_at", input.fromIso)
      .lt("scheduled_at", input.toIso);
    if (selectErr) return { ok: false, error: selectErr.message };

    const ids = (targets ?? []).map((r) => r.id as string);
    if (ids.length === 0) return { ok: true, affected: 0 };
    if (ids.length > MAX_AFFECTED) {
      return {
        ok: false,
        error: `Operacija bi obuhvatila ${ids.length} časova (max ${MAX_AFFECTED}). Suzi opseg.`,
      };
    }

    const { error: updErr } = await supabase
      .from("lessons")
      .update({ status: input.reason })
      .in("id", ids);
    if (updErr) return { ok: false, error: updErr.message };

    revalidatePath("/schedule");
    revalidatePath("/dashboard");
    revalidatePath("/billing");

    return { ok: true, affected: ids.length };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}

/**
 * Bulk-shift scheduled lessons in a window by N minutes (positive = later,
 * negative = earlier). Only touches scheduled lessons.
 */
export async function bulkRescheduleLessons(
  input: BulkRescheduleInput,
): Promise<BulkResult> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();

    if (!Number.isFinite(input.offsetMinutes) || input.offsetMinutes === 0) {
      return { ok: false, error: "Pomak mora biti različit od 0 minuta." };
    }

    const { data: targets, error: selectErr } = await supabase
      .from("lessons")
      .select("id, scheduled_at")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .eq("status", "scheduled")
      .gte("scheduled_at", input.fromIso)
      .lt("scheduled_at", input.toIso);
    if (selectErr) return { ok: false, error: selectErr.message };

    const list = (targets ?? []) as Array<{ id: string; scheduled_at: string }>;
    if (list.length === 0) return { ok: true, affected: 0 };
    if (list.length > MAX_AFFECTED) {
      return {
        ok: false,
        error: `Operacija bi obuhvatila ${list.length} časova (max ${MAX_AFFECTED}). Suzi opseg.`,
      };
    }

    // No native UPDATE … SET col = col + interval via PostgREST, so we issue
    // one row-by-row update each within a single round-trip via Promise.all.
    const updates = await Promise.all(
      list.map((l) => {
        const next = new Date(
          new Date(l.scheduled_at).getTime() + input.offsetMinutes * 60_000,
        ).toISOString();
        return supabase
          .from("lessons")
          .update({ scheduled_at: next })
          .eq("id", l.id);
      }),
    );
    const failed = updates.find((r) => r.error);
    if (failed?.error) return { ok: false, error: failed.error.message };

    revalidatePath("/schedule");
    revalidatePath("/dashboard");

    return { ok: true, affected: list.length };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}
