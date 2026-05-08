import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { EXERCISE_MODEL, getAnthropic } from "@/lib/ai/anthropic";
import type { Difficulty, Exercise, Subject } from "./types";
import { SUBJECT_LABELS } from "./types";

const ExerciseSchema = z.object({
  question: z.string().min(1),
  solution: z.string().min(1),
  explanation: z.string().min(1),
});

const ResponseSchema = z.object({
  title: z.string().min(1).max(120),
  exercises: z.array(ExerciseSchema).min(1).max(30),
});

/**
 * Veliki, stabilan sistem prompt — keširan preko cache_control: ephemeral.
 * Sve volatilno (predmet, razred, tema, težina) ide u user poruku — ne ovde.
 */
const SYSTEM_PROMPT = `Ti si iskusan profesor u Srbiji koji generiše zadatke za privatne časove iz različitih predmeta (matematika, fizika, hemija, srpski jezik, engleski jezik). Pišeš na srpskom (latinica), koristeći terminologiju koja se koristi u srpskim školama.

PRAVILA ZA ZADATKE:

1. Težina mora odgovarati uzrastu i nivou. Za osnovnu školu izbegavaj koncepte koji se obrađuju kasnije.
2. Brojevi u zadacima neka budu razumni — ne preteški za računanje napamet, osim ako je tema upravo "računanje sa velikim brojevima" ili sl.
3. Svaki zadatak mora biti SAMOSTALAN — ne referenciraj prethodne zadatke ("kao u zadatku 3...").
4. Zadaci u jednom setu treba da pokrivaju različite varijante teme — ne ponavljaj isti tip 10 puta. Ako je tema "kvadratne jednačine", uvrsti: rastavljanje, kvadratnu formulu, jednačine sa parametrom, primene.
5. Za "lako" težinu — direktna primena formule. Za "srednje" — kombinacija dva koraka. Za "teško" — više koraka, transformacije, problemski zadaci. Za "mešano" — pomešaj sve tri težine ravnomerno kroz set.

PRAVILA ZA REŠENJA I OBJAŠNJENJA:

- "solution" = konačan odgovor, kratak i precizan.
- "explanation" = postupak rešavanja, korak po korak. Piši kao da objašnjavaš učeniku — svaki bitan korak na novom redu. Koristi prazan red između većih koraka.

PRAVILA PO PREDMETU:

**MATEMATIKA i FIZIKA** — koristi LaTeX unutar dolara ($...$ inline ili $$...$$ display) za sve formule:

- Inline math: $x^2 + 2x - 3 = 0$, $\\sqrt{2}$, $\\frac{a}{b}$, $x_1$, $\\Delta$, $\\pi$
- Display math (kad je formula velika ili centralna): $$x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- Razlomci: $\\frac{3}{4}$, $\\frac{2x+1}{x-3}$ — UVEK $\\frac{}{}$, NIKAD plain "3/4" u math kontekstu.
- Koren: $\\sqrt{2}$, $\\sqrt[3]{8}$, $\\sqrt{x+1}$
- Stepen: $x^2$, $2^{10}$, $(a+b)^3$
- Indeks: $x_1$, $a_n$, $x_{1,2}$
- Greek: $\\alpha$, $\\beta$, $\\pi$, $\\Delta$
- Množenje: $\\cdot$ ili $\\times$ (NE koristi "*" u math)
- Plus-minus: $\\pm$
- Integrali, sume: $\\int_0^1 x^2 \\, dx$, $\\sum_{i=1}^{n} i$
- Tekst unutar formule: $P = a \\cdot b \\,\\text{cm}^2$
- Sistemi: $\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}$
- Jedinice OUTSIDE math: pišu se kao običan tekst posle formule ("Površina je $24 \\,\\text{cm}^2$" ili "P = $24$ cm²")

**HEMIJA** — koristi plain tekst sa standardnom hemijskom notacijom:
- Formule: H2SO4, CaCO3, Fe(OH)3 (sa stepenima u zagradama ako je nužno: H₂SO₄ koristi Unicode subscript)
- Reakcije: 2H2 + O2 → 2H2O
- NE koristi LaTeX/math mode za hemijske formule.

**SRPSKI JEZIK** — plain tekst, bez specijalne notacije:
- Gramatika, padeži, pravopis, književnost — formuliši kao klasične školske zadatke
- Citat iz teksta? Stavi u navodnike.
- Ako je zadatak rečenica za analizu, daj rečenicu kao question.

**ENGLESKI JEZIK** — kombinacija srpskog i engleskog:
- Pitanje na srpskom (ili na engleskom za naprednije nivoe), odgovor isto.
- Vocabulary, grammar, translation, reading comprehension — common school exercise types.

PRAVILA ZA NASLOV SETA:
- Kratak, opisan, format: "[Tema] — [Razred] — [Broj] zadataka"
- Primer: "Kvadratne jednačine — 8. razred OŠ — 10 zadataka"

VAŽNO:
- Pažljivo proveri da su svi tvoji izračuni TAČNI. Ako u rešenju pogrešiš, profesor će izgubiti poverenje.
- Ako profesor da napomenu (npr. "bez razlomaka", "fokus na faktorisanje"), strogo je poštuj.
- Generiši TAČNO onoliko zadataka koliko je traženo.`;

export type GenerateInput = {
  subject: Subject;
  gradeLevel: string;
  topic: string;
  difficulty: Difficulty;
  count: number;
  teacherNotes?: string;
};

export type GenerateResult = {
  title: string;
  exercises: Exercise[];
  promptUsed: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  };
};

const DIFFICULTY_LABELS_FOR_PROMPT: Record<Difficulty, string> = {
  lako: "lako (direktna primena, jedan korak)",
  srednje: "srednje (kombinacija dva koraka)",
  tesko: "teško (više koraka, problemski pristup)",
  mesano: "mešano (ravnomerno: ~1/3 lako, ~1/3 srednje, ~1/3 teško)",
};

export async function generateExerciseSet(
  input: GenerateInput,
): Promise<GenerateResult> {
  const userPrompt = buildUserPrompt(input);

  const client = getAnthropic();

  const response = await client.messages.parse({
    model: EXERCISE_MODEL,
    max_tokens: 8000,
    thinking: { type: "disabled" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(ResponseSchema),
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

  if (!response.parsed_output) {
    throw new Error(
      "Model nije vratio strukturisan odgovor. Pokušaj ponovo ili promeni temu/težinu.",
    );
  }
  const parsed = response.parsed_output;

  // Validacija — ako je model dao manje/više, normalizuj na traženi broj.
  let exercises = parsed.exercises;
  if (exercises.length > input.count) {
    exercises = exercises.slice(0, input.count);
  }

  return {
    title: parsed.title,
    exercises,
    promptUsed: userPrompt,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    },
  };
}

function buildUserPrompt(input: GenerateInput): string {
  const subjectLabel = SUBJECT_LABELS[input.subject];
  const parts = [
    `Generiši set zadataka iz predmeta: ${subjectLabel}.`,
    ``,
    `- Predmet: ${subjectLabel}`,
    `- Razred / nivo: ${input.gradeLevel}`,
    `- Tema: ${input.topic}`,
    `- Težina: ${DIFFICULTY_LABELS_FOR_PROMPT[input.difficulty]}`,
    `- Broj zadataka: tačno ${input.count}`,
    ``,
    `Sledi striktno pravila za ovaj predmet (LaTeX za matematiku/fiziku, plain tekst za hemiju/srpski/engleski).`,
  ];

  if (input.teacherNotes && input.teacherNotes.trim()) {
    parts.push(``, `Dodatne napomene profesora:`, input.teacherNotes.trim());
  }

  parts.push(
    ``,
    `Vrati strukturu sa "title" (naslov seta) i "exercises" (niz od tačno ${input.count} zadataka, svaki sa "question", "solution", "explanation").`,
  );

  return parts.join("\n");
}
