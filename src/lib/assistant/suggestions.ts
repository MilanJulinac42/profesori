"use server";

import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { computeBillableStatuses } from "@/lib/payments/types";
import { getOrgSettings } from "@/lib/settings/queries";
import { getOrgDebtors } from "@/lib/payments/queries";
import { countLessonsMissingNotes, getOldestLessonNeedingNotes } from "@/lib/lessons/queries";
import { countSubmittedHomework } from "@/lib/homework/queries";
import { formatRsd } from "@/lib/money";

export type AssistantSuggestion = {
  /** Short display label. */
  label: string;
  /** Pre-baked message sent to the AI when the user clicks the suggestion. */
  prompt: string;
};

const FALLBACK: AssistantSuggestion[] = [
  { label: "Ko mi duguje?", prompt: "Pokaži mi sve učenike koji duguju, sortirano po iznosu." },
  { label: "Kako da zakažem čas?", prompt: "Kako da zakažem novi čas?" },
  { label: "Gde su mi domaći?", prompt: "Gde mogu da vidim domaće zadatke?" },
  { label: "Pokaži aktivnost", prompt: "Šta se dešavalo poslednjih dana?" },
];

const MAX = 4;

/**
 * Returns a short list of context-aware starter prompts for the assistant
 * empty-state. Reads the same signals the dashboard pending-work card uses
 * so suggestions match what the teacher would naturally see anyway.
 */
export async function getAssistantSuggestions(): Promise<AssistantSuggestion[]> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();

    const org = Array.isArray(profile.organizations)
      ? profile.organizations[0]
      : profile.organizations;
    if (!org) return FALLBACK;

    const settings = await getOrgSettings(supabase, org.id);
    const billableStatuses = computeBillableStatuses(settings);

    const [debtors, missingNotesCount, oldestNeedingNotes, submittedHomeworkCount] =
      await Promise.all([
        getOrgDebtors(supabase, billableStatuses),
        countLessonsMissingNotes(supabase),
        getOldestLessonNeedingNotes(supabase),
        countSubmittedHomework(supabase),
      ]);

    const out: AssistantSuggestion[] = [];

    // 1) Biggest debtor → propose collection
    if (debtors.debtors.length > 0) {
      const top = debtors.debtors[0];
      const firstName = top.full_name.split(/\s+/)[0] ?? top.full_name;
      out.push({
        label: `Opomeni ${firstName} — ${formatRsd(top.debt, false)} RSD`,
        prompt: `Pošalji opomenu za ${top.full_name}, duguje ${formatRsd(
          top.debt,
          false,
        )} RSD.`,
      });
    }

    // 2) Missing lesson notes
    if (missingNotesCount > 0 && oldestNeedingNotes) {
      out.push({
        label: `Beleška za ${oldestNeedingNotes.student_name}`,
        prompt: `Otvori belešku za čas ${oldestNeedingNotes.student_name} od ${new Date(
          oldestNeedingNotes.scheduled_at,
        ).toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "short" })}.`,
      });
    }

    // 3) Submitted homework awaiting review
    if (submittedHomeworkCount > 0) {
      out.push({
        label: `${submittedHomeworkCount} domaći za pregled`,
        prompt: "Koji domaći zadaci čekaju da ih pregledam?",
      });
    }

    // 4) Always-useful: schedule a lesson
    out.push({
      label: "Zakaži čas",
      prompt: "Zakaži mi čas — pitaj me za detalje koje ti trebaju.",
    });

    // 5) Pad with fallbacks if we don't have enough.
    for (const s of FALLBACK) {
      if (out.length >= MAX) break;
      if (out.some((o) => o.label === s.label)) continue;
      out.push(s);
    }

    return out.slice(0, MAX);
  } catch {
    return FALLBACK;
  }
}
