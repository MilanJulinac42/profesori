import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { EXERCISE_MODEL, getAnthropic } from "@/lib/ai/anthropic";
import { TRANSCRIBE_MODEL, getOpenAI } from "@/lib/ai/openai";

/**
 * Strukturisan draft koji UI prikaže profesoru za pregled/edit pre čuvanja.
 * Sva polja su opciona — ako AI nije siguran, ostavlja prazno.
 */
const DraftSchema = z.object({
  notes_after_lesson: z
    .string()
    .describe(
      "Očišćena beleška o času — narativ na srpskom (latinica), 2-4 rečenice. Bez 'uhm', bez ponavljanja.",
    ),
  topics_covered: z
    .array(z.string())
    .max(10)
    .describe(
      "Konkretne teme/podteme koje su pokrivene na času (npr. 'Pitagorina teorema', 'Kvadratne jednačine'). Kratki tagovi, ne rečenice.",
    ),
  progress_summary: z
    .string()
    .describe(
      "1-2 rečenice o napretku učenika za potrebe izveštaja roditelju/učeniku. Konkretno, ne uopšteno.",
    ),
  next_lesson_plan: z
    .string()
    .describe(
      "Šta bi trebalo da se uradi na sledećem času — kratak plan u 1-2 rečenice. Prazno ako profesor nije pomenuo.",
    ),
  suggested_rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .nullable()
    .describe(
      "Predlog ocene časa od 1 (vrlo loše) do 5 (odlično). null ako se ne može zaključiti iz beleške.",
    ),
});

export type LessonDraft = z.infer<typeof DraftSchema>;

const CLEANUP_SYSTEM_PROMPT = `Ti si asistent profesoru privatnih časova u Srbiji. Tvoj zadatak je da iz sirove beleške profesora (koja može biti transkript glasovne poruke ili otkucan tekst) izvučeš strukturisani draft za zvaničnu evidenciju časa.

PRAVILA:

1. Piši na srpskom (latinica), profesionalno ali toplo. Ne kopiraj profesorove pošteđice ili kolokvijalizme — pretvori u jasan tekst.
2. Iz transkripta često dolazi šum: "ovaj... uhm... pa... znači..." — sve takvo brišeš.
3. Ako profesor priča o učeniku u trećem licu ("Marko je danas...") zadrži treće lice. Ako u drugom licu ("danas si dobro radio") zadrži drugo lice.
4. NE izmišljaj činjenice. Ako profesor nije pomenuo neku temu, ne stavljaj je u "topics_covered". Ako nije pomenuo plan za sledeći put, ostavi "next_lesson_plan" prazno.
5. "topics_covered" su KONKRETNE teme — "Kvadratne jednačine", "Razlomci", "Pitagorina teorema". NE "matematika", NE "vežbanje", NE "domaći".
6. "progress_summary" je za roditelje/učenike — formuliši kao da to čita neko ko nije bio na času. Naglasi šta je novo savladao ili gde i dalje ima poteškoća. Konkretno, ne floskule.
7. "notes_after_lesson" je za profesorovu evidenciju — može da bude detaljnija od progress_summary, sa metodikom i napomenama.
8. "suggested_rating": ako profesor kaže "odličan čas" → 5. "Težak čas, slabo je išlo" → 2. "Solidno" → 3. Ako nema jasnog tona → null.

Vraćaš isključivo strukturisan JSON prema šemi.`;

/**
 * Prima audio Blob/File i vraća sirov transkript preko Whisper-a.
 */
export async function transcribeAudio(audio: File): Promise<string> {
  const openai = getOpenAI();

  const response = await openai.audio.transcriptions.create({
    file: audio,
    model: TRANSCRIBE_MODEL,
    language: "sr", // ISO-639-1 za srpski — pomaže kvalitetu
    response_format: "text",
  });

  // gpt-4o-mini-transcribe sa response_format "text" vraća string direktno.
  return typeof response === "string" ? response : (response as { text: string }).text;
}

export type LessonContext = {
  studentName: string;
  studentGrade: string | null;
  durationMinutes: number;
  recentTopics?: string[]; // poslednjih X časova ovog učenika, za kontinuitet
};

/**
 * Prima sirov tekst (transkript ili otkucan) + kontekst časa, vraća strukturisan draft.
 */
export async function processNoteText(
  rawText: string,
  ctx: LessonContext,
): Promise<LessonDraft> {
  if (!rawText.trim()) {
    throw new Error("Beleška je prazna.");
  }

  const anthropic = getAnthropic();

  const userPrompt = buildUserPrompt(rawText, ctx);

  const response = await anthropic.messages.parse({
    model: EXERCISE_MODEL,
    max_tokens: 2000,
    thinking: { type: "disabled" },
    output_config: {
      effort: "low",
      format: zodOutputFormat(DraftSchema),
    },
    system: [
      {
        type: "text",
        text: CLEANUP_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  if (!response.parsed_output) {
    throw new Error("AI nije uspeo da strukturira belešku. Otkucaj je ručno.");
  }

  return response.parsed_output;
}

function buildUserPrompt(rawText: string, ctx: LessonContext): string {
  const parts = [
    `KONTEKST ČASA:`,
    `- Učenik: ${ctx.studentName}`,
  ];
  if (ctx.studentGrade) parts.push(`- Razred: ${ctx.studentGrade}`);
  parts.push(`- Trajanje časa: ${ctx.durationMinutes} min`);
  if (ctx.recentTopics && ctx.recentTopics.length) {
    parts.push(
      `- Skorašnje teme (za kontinuitet): ${ctx.recentTopics.slice(0, 5).join(", ")}`,
    );
  }
  parts.push(
    ``,
    `SIROVA BELEŠKA PROFESORA:`,
    `"""`,
    rawText.trim(),
    `"""`,
    ``,
    `Izvuci strukturisan draft prema šemi.`,
  );
  return parts.join("\n");
}

/**
 * End-to-end: audio → transkript → strukturisan draft.
 */
export async function transcribeAndProcess(
  audio: File,
  ctx: LessonContext,
): Promise<{ draft: LessonDraft; transcript: string }> {
  const transcript = await transcribeAudio(audio);
  const draft = await processNoteText(transcript, ctx);
  return { draft, transcript };
}
