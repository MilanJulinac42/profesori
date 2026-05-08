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

const ParseSchema = z.object({
  intent: z
    .enum(["reschedule", "cancel", "praise", "question", "complaint", "other"])
    .describe(
      "Tip namere: reschedule (pomeranje), cancel (otkaz), praise (pohvala), question (pitanje), complaint (žalba), other (drugo).",
    ),
  student_match: z
    .string()
    .nullable()
    .describe(
      "Ime učenika ako je pomenut u poruci, INAČE null. Treba da matchuje neko iz spiska učenika ili biti null.",
    ),
  extracted_when: z
    .string()
    .nullable()
    .describe(
      "Datum/vreme pomenuto u poruci (npr. 'utorak u 18h', '15. maja') ili null.",
    ),
  summary: z
    .string()
    .min(10)
    .max(300)
    .describe("1-2 rečenice sažetka šta roditelj traži/javlja, na srpskom."),
  suggested_action: z
    .string()
    .min(10)
    .max(400)
    .describe("Konkretna akcija koju profesor treba da uradi, na srpskom."),
  suggested_reply: z
    .string()
    .min(20)
    .max(600)
    .describe(
      "Predlog odgovora koji profesor može da kopira i pošalje roditelju, profesionalno ali toplo, na srpskom.",
    ),
});

export type ParseResult =
  | { ok: true; data: z.infer<typeof ParseSchema> }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `Ti si asistent profesoru privatnih časova u Srbiji. Profesor ti daje sirov tekst poruke koju je dobio od roditelja (kopiran iz WhatsApp/SMS). Tvoj zadatak je da:

1. Otkriješ INTENT — šta roditelj traži:
   - reschedule = traži pomeranje termina
   - cancel = otkazuje čas
   - praise = pohvala / zahvalnica
   - question = pitanje (ne zahteva akciju)
   - complaint = žalba / nezadovoljstvo
   - other = nešto drugo

2. Ako je u tekstu pomenuto IME UČENIKA (sa spiska koji ti dam), izvuci ga.

3. Ako je pomenut DATUM ili VREME, izvuci ga u prirodnom srpskom obliku ("utorak u 18h", "15. maja", "danas", itd).

4. Napiši SAŽETAK 1-2 rečenice — šta roditelj javlja/traži.

5. Napiši PREDLOG AKCIJE — šta profesor treba da uradi konkretno (npr. "Otkaži čas Marka u utorak", "Predloži alternativan termin u sredu", "Samo odgovori sa zahvalnicom").

6. Napiši PREDLOG ODGOVORA na srpskom (latinica), profesionalan ali topao ton, koji profesor može da kopira i pošalje roditelju.

Vraćaš ISKLJUČIVO strukturisan JSON.`;

export async function parseParentMessageAction(
  rawText: string,
): Promise<ParseResult> {
  try {
    if (!rawText || rawText.trim().length < 5) {
      return { ok: false, error: "Tekst poruke je prekratak." };
    }
    if (rawText.length > 4000) {
      return { ok: false, error: "Tekst poruke je predugačak (max 4000 char)." };
    }

    await requireUser();
    const supabase = await createClient();

    // Pull aktivnih učenika za context (model može da matchuje ime)
    const { data: studentsData } = await supabase
      .from("students")
      .select("full_name, parent_name")
      .eq("status", "active")
      .is("deleted_at", null)
      .order("full_name");

    const students = (studentsData ?? []) as Array<{
      full_name: string;
      parent_name: string | null;
    }>;

    const studentList =
      students.length > 0
        ? students
            .slice(0, 50)
            .map(
              (s) =>
                `- ${s.full_name}${s.parent_name ? ` (roditelj: ${s.parent_name})` : ""}`,
            )
            .join("\n")
        : "(nema aktivnih učenika)";

    const userPrompt = [
      `LISTA AKTIVNIH UČENIKA (matchuj imena ako se pominju u poruci):`,
      studentList,
      ``,
      `PORUKA OD RODITELJA:`,
      `"""`,
      rawText.trim(),
      `"""`,
      ``,
      `Analiziraj poruku i vrati strukturisan JSON.`,
    ].join("\n");

    const client = getAnthropic();
    const callModel = (model: string) => {
      const supportsEffort =
        model.includes("sonnet") || model.includes("opus");
      return client.messages.parse({
        model,
        max_tokens: 1200,
        thinking: { type: "disabled" },
        output_config: {
          ...(supportsEffort ? { effort: "low" as const } : {}),
          format: zodOutputFormat(ParseSchema),
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

    return { ok: true, data: response.parsed_output };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Greška.";
    if (/529|overloaded/i.test(msg)) {
      return {
        ok: false,
        error: "AI je preopterećen. Pokušaj za par sekundi.",
      };
    }
    return { ok: false, error: msg };
  }
}
