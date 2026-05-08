"use server";

import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  EXERCISE_MODEL,
  FALLBACK_MODEL,
  getAnthropic,
  isOverloadedError,
} from "@/lib/ai/anthropic";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";

const SuggestSchema = z.object({
  topic: z
    .string()
    .min(2)
    .max(160)
    .describe(
      "Kratak naslov teme (idealno do 80 char, max 160). Npr. 'Tekstualni zadaci sa sistemom dve jednačine'.",
    ),
  reason: z
    .string()
    .min(20)
    .max(400)
    .describe(
      "1-2 rečenice ZAŠTO baš to — referencira konkretnu stvar iz prošlih beleški.",
    ),
});

export type SuggestionResult =
  | { ok: true; topic: string; reason: string }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `Ti si AI asistent profesoru privatnih časova u Srbiji. Tvoj zadatak je da na osnovu beleški sa POSLEDNJIH par časova predložiš ŠTA da raditi na sledećem času.

PRAVILA:

1. Predlog mora biti KONKRETAN — ne "vežbati matematiku" nego "tekstualni zadaci sa sistemom dve jednačine, fokus na postavljanje".
2. Reason (zašto) mora referencirati STVARNU stvar iz beleški: "Marko je prošli put zapeo na X" ili "Tri puta zaredom slabo prošlo Y".
3. Ako su prošli časovi pokazali napredak, predlog je SLEDEĆI KORAK u programu (ne ponavljanje već savladane teme).
4. Ako su pokazali rupu/slabost, predlog je VEŽBANJE TE SLABE TAČKE.
5. Piši kratko, profesionalno, na srpskom (latinica). Bez floskula tipa "Predlažem da radimo...".

PRIMERI:

Loše: { "topic": "Vežbanje matematike", "reason": "Marko treba još da uvežbava." }

Dobro: {
  "topic": "Tekstualni zadaci sa kvadratnom formulom",
  "reason": "Prošla 2 časa Marko sigurno rešava jednačine sa datim koeficijentima, ali nije probao tekstualne. To je sledeći logičan korak pre kontrolne."
}

Dobro: {
  "topic": "Ponavljanje rastavljanja na činioce",
  "reason": "Pre 2 časa zapeo je na rastavljanju trinoma — od tada nismo se vraćali na to. Bolje ojačati pre nego pređemo na sisteme."
}

Vraćaš ISKLJUČIVO JSON sa "topic" i "reason" poljima.`;

export async function suggestNextTopicAction(
  studentId: string,
): Promise<SuggestionResult> {
  try {
    if (!studentId) return { ok: false, error: "Nema učenika." };

    await requireUser();
    const supabase = await createClient();

    // Pull last 5 completed lessons sa beleškama (ASC pa reverse u prompt-u).
    const { data: lessons } = await supabase
      .from("lessons")
      .select(
        "scheduled_at, topics_covered, lesson_rating, progress_summary, next_lesson_plan, notes_after_lesson",
      )
      .eq("student_id", studentId)
      .eq("status", "completed")
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: false })
      .limit(5);

    const past = (lessons ?? []).filter(
      (l) =>
        l.progress_summary?.trim() ||
        l.next_lesson_plan?.trim() ||
        l.notes_after_lesson?.trim(),
    );

    if (past.length === 0) {
      return {
        ok: false,
        error:
          "Nema beleški iz prošlih časova — popuni bar jednu pa probaj ponovo.",
      };
    }

    // Pull student basic info for context
    const { data: student } = await supabase
      .from("students")
      .select("full_name, grade")
      .eq("id", studentId)
      .maybeSingle();

    const userPrompt = buildUserPrompt({
      studentName: (student?.full_name as string) ?? "Učenik",
      grade: (student?.grade as string | null) ?? null,
      lessons: past.reverse().map((l) => ({
        date: new Date(l.scheduled_at).toISOString().slice(0, 10),
        topics: l.topics_covered ?? [],
        rating: l.lesson_rating,
        progressSummary: l.progress_summary?.trim() || null,
        nextPlan: l.next_lesson_plan?.trim() || null,
      })),
    });

    const client = getAnthropic();
    const callModel = (model: string) => {
      const supportsEffort =
        model.includes("sonnet") || model.includes("opus");
      return client.messages.parse({
        model,
        max_tokens: 400,
        thinking: { type: "disabled" },
        output_config: {
          ...(supportsEffort ? { effort: "low" as const } : {}),
          format: zodOutputFormat(SuggestSchema),
        },
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userPrompt }],
      });
    };

    let response;
    try {
      response = await callModel(EXERCISE_MODEL);
    } catch (err) {
      if (isOverloadedError(err)) response = await callModel(FALLBACK_MODEL);
      else throw err;
    }

    if (!response.parsed_output) {
      return { ok: false, error: "AI nije vratio strukturisan odgovor." };
    }

    return {
      ok: true,
      topic: response.parsed_output.topic,
      reason: response.parsed_output.reason,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Greška.";
    if (/529|overloaded/i.test(msg)) {
      return {
        ok: false,
        error: "AI je trenutno preopterećen. Pokušaj za par sekundi.",
      };
    }
    return { ok: false, error: msg };
  }
}

type Lesson = {
  date: string;
  topics: string[];
  rating: number | null;
  progressSummary: string | null;
  nextPlan: string | null;
};

function buildUserPrompt(input: {
  studentName: string;
  grade: string | null;
  lessons: Lesson[];
}): string {
  const lines: string[] = [];
  lines.push(`UČENIK: ${input.studentName}${input.grade ? ` (${input.grade})` : ""}`);
  lines.push(`POSLEDNJI ČASOVI (hronološki, najstariji ka najnovijem):`);
  lines.push("");

  for (const l of input.lessons) {
    const meta = [
      l.date,
      l.rating !== null ? `★${l.rating}/5` : null,
      l.topics.length > 0 ? `teme: ${l.topics.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    lines.push(`[${meta}]`);
    if (l.progressSummary) lines.push(`Napredak: ${l.progressSummary}`);
    if (l.nextPlan) lines.push(`Plan koji je profesor zapisao za sledeći put: ${l.nextPlan}`);
    lines.push("");
  }

  lines.push(
    `Predloži temu i obrazloženje za SLEDEĆI čas. Pre svega obrati pažnju na poslednji "Plan za sledeći put" ako postoji — to je već profesorov plan, samo to potvrdi i dodaj kontekst zašto.`,
  );

  return lines.join("\n");
}
