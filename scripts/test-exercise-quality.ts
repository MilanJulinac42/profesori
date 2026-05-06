/**
 * Test kvaliteta AI generatora zadataka kroz razne razrede.
 * Generiše po jedan set za svaki nivo i prikazuje pitanja+rešenja
 * (bez postupka — da bi bilo čitljivo u terminalu).
 *
 * Pokretanje: npx tsx scripts/test-exercise-quality.ts
 */
import { config } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

config({ path: ".env.local", override: true });

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("Missing ANTHROPIC_API_KEY");
  process.exit(1);
}

const client = new Anthropic({ apiKey, maxRetries: 5 });
const MODEL = "claude-sonnet-4-6";

const ExerciseSchema = z.object({
  question: z.string().min(1),
  solution: z.string().min(1),
  explanation: z.string().min(1),
});
const ResponseSchema = z.object({
  title: z.string().min(1).max(120),
  exercises: z.array(ExerciseSchema).min(1).max(10),
});

const SYSTEM_PROMPT = `Ti si iskusan profesor matematike u Srbiji koji generiše zadatke za privatne časove. Pišeš na srpskom (latinica).

PRAVILA:
1. Težina mora odgovarati uzrastu. Brojevi razumni.
2. Svaki zadatak SAMOSTALAN — ne referenciraj druge.
3. Variraj tipove zadataka iz iste teme.
4. "solution" = konačan odgovor, kratak.
5. "explanation" = postupak korak po korak.

LaTeX OBAVEZAN za matematiku — koristi $...$ i $$...$$:
- Razlomak: $\\frac{a}{b}$
- Stepen: $x^2$, $2^{10}$
- Koren: $\\sqrt{2}$
- Greek: $\\alpha$, $\\pi$, $\\Delta$
- NE koristi plain "x^2" ili "(2x+1)/(x-3)" van math konteksta.

Pažljivo: računi MORAJU biti tačni.`;

const TEST_CASES: { grade: string; topic: string; difficulty: string }[] = [
  { grade: "5. razred OŠ", topic: "Razlomci — sabiranje i oduzimanje", difficulty: "lako" },
  { grade: "6. razred OŠ", topic: "Procenti", difficulty: "srednje" },
  { grade: "7. razred OŠ", topic: "Linearne jednačine", difficulty: "srednje" },
  { grade: "8. razred OŠ", topic: "Kvadratne jednačine", difficulty: "srednje" },
  { grade: "1. razred SŠ", topic: "Apsolutna vrednost i nejednačine", difficulty: "srednje" },
  { grade: "2. razred SŠ", topic: "Trigonometrijske funkcije", difficulty: "srednje" },
  { grade: "3. razred SŠ", topic: "Logaritmi", difficulty: "srednje" },
  { grade: "4. razred SŠ / matura", topic: "Izvodi i analiza funkcije", difficulty: "teško" },
];

async function generate(grade: string, topic: string, difficulty: string) {
  const userPrompt = [
    `Generiši set zadataka iz matematike sa sledećim parametrima:`,
    ``,
    `- Razred / nivo: ${grade}`,
    `- Tema: ${topic}`,
    `- Težina: ${difficulty}`,
    `- Broj zadataka: tačno 4`,
    ``,
    `Vrati strukturu sa "title" (naslov seta) i "exercises" (niz od tačno 4 zadataka).`,
  ].join("\n");

  const t0 = Date.now();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "disabled" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(ResponseSchema),
    },
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userPrompt }],
  });
  const ms = Date.now() - t0;

  if (!response.parsed_output) {
    return { error: "no parsed_output", ms };
  }
  return {
    title: response.parsed_output.title,
    exercises: response.parsed_output.exercises,
    ms,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheRead: response.usage.cache_read_input_tokens ?? 0,
  };
}

async function main() {
  for (const tc of TEST_CASES) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`${tc.grade} — ${tc.topic} — ${tc.difficulty}`);
    console.log("=".repeat(80));
    try {
      const r = await generate(tc.grade, tc.topic, tc.difficulty);
      if ("error" in r) {
        console.log(`  ERROR: ${r.error}`);
        continue;
      }
      console.log(`  Title: ${r.title}`);
      console.log(
        `  Time: ${r.ms}ms · in=${r.inputTokens}t out=${r.outputTokens}t cache=${r.cacheRead}t`,
      );
      r.exercises.forEach((ex, i) => {
        console.log(`\n  ${i + 1}. ${ex.question}`);
        console.log(`     → ${ex.solution}`);
      });
    } catch (err) {
      console.log(`  EXCEPTION: ${err instanceof Error ? err.message : err}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
