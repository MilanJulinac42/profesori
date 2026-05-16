"use server";

import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";

/**
 * Anthropic-format conversation history owned by the client. The streaming
 * endpoint at /api/assistant/chat receives this from the client on every send.
 * Kept here as the shared type between the route handler and the client UI.
 */
export type HistoryMessage = {
  role: "user" | "assistant";
  content: Anthropic.MessageParam["content"];
};

// ============================================================
// Confirm proposal — frontend poziva ovo posle korisničkog Yes
// ============================================================

export type ExecuteProposalInput = {
  proposal: {
    type:
      | "create_lesson"
      | "mark_payment"
      | "reschedule_lesson"
      | "cancel_lesson"
      | "add_homework";
    params: Record<string, unknown>;
  };
};

export type ExecuteProposalResult =
  | {
      ok: true;
      message: string;
      /** Synthetic turns the client should append to its history so the AI
       *  knows the proposal was confirmed on the next message. */
      newTurns: HistoryMessage[];
    }
  | { ok: false; error: string };

export async function executeProposalAction(
  input: ExecuteProposalInput,
): Promise<ExecuteProposalResult> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();

    const orgId = profile.organization_id;
    let resultMessage = "";

    switch (input.proposal.type) {
      case "create_lesson": {
        const p = input.proposal.params;
        const { error } = await supabase.from("lessons").insert({
          organization_id: orgId,
          student_id: String(p.student_id),
          scheduled_at: String(p.scheduled_at_iso),
          duration_minutes: Number(p.duration_minutes),
          price: Number(p.price_para),
          status: "scheduled",
        });
        if (error) return { ok: false, error: error.message };
        resultMessage = "Čas je kreiran.";
        break;
      }
      case "mark_payment": {
        const p = input.proposal.params;
        const { error } = await supabase.from("payments").insert({
          organization_id: orgId,
          student_id: String(p.student_id),
          amount: Number(p.amount_para),
          paid_at: String(p.paid_at_iso ?? new Date().toISOString()),
          method: String(p.method ?? "cash"),
          note: p.note ? String(p.note) : null,
        });
        if (error) return { ok: false, error: error.message };
        resultMessage = "Uplata je upisana.";
        break;
      }
      case "reschedule_lesson": {
        const p = input.proposal.params;
        const { error } = await supabase
          .from("lessons")
          .update({ scheduled_at: String(p.new_scheduled_at_iso) })
          .eq("id", String(p.lesson_id));
        if (error) return { ok: false, error: error.message };
        resultMessage = "Termin je pomeren.";
        break;
      }
      case "cancel_lesson": {
        const p = input.proposal.params;
        const { error } = await supabase
          .from("lessons")
          .update({ status: String(p.reason) })
          .eq("id", String(p.lesson_id));
        if (error) return { ok: false, error: error.message };
        resultMessage = "Čas je otkazan.";
        break;
      }
      case "add_homework": {
        const p = input.proposal.params;
        const { error } = await supabase.from("homework").insert({
          organization_id: orgId,
          student_id: String(p.student_id),
          title: String(p.title),
          description: p.description ? String(p.description) : null,
          due_date: p.due_date ? String(p.due_date) : null,
          lesson_id: p.lesson_id ? String(p.lesson_id) : null,
        });
        if (error) return { ok: false, error: error.message };
        resultMessage = "Domaći je zadat.";
        break;
      }
      default:
        return { ok: false, error: "Nepoznat tip proposal-a." };
    }

    // Synthetic turns the client appends to history so the AI is aware of
    // the confirmation on subsequent turns.
    const newTurns: HistoryMessage[] = [
      {
        role: "user",
        content: `[Korisnik je potvrdio: ${input.proposal.type}]`,
      },
      {
        role: "assistant",
        content: [{ type: "text", text: `✓ ${resultMessage}` }],
      },
    ];

    return { ok: true, message: resultMessage, newTurns };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}
