/**
 * Test harness za AI asistenta.
 *
 * Replicira chat-loop iz src/lib/assistant/chat.ts ali bez Next.js auth-a —
 * koristi service-role klijenta direktno. Šalje niz realističnih promptova
 * i loguje koje tool-ove je AI pozvao i šta je odgovorio.
 *
 * Pokretanje: npx tsx scripts/test-assistant.ts
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { format } from "date-fns";
import { srLatn } from "date-fns/locale";
import { TOOLS, executeTool } from "../src/lib/assistant/tools";

config({ path: ".env.local", override: true });

const apiKey = process.env.ANTHROPIC_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!apiKey || !supabaseUrl || !serviceKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const ai = new Anthropic({ apiKey, maxRetries: 3 });
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `Ti si AI asistent profesoru privatnih časova u Srbiji. Imaš set ALATA. Koristi ih kad ti trebaju podaci ili kad želiš da predložiš akciju. Za bilo šta vezano za konkretnog učenika, OBAVEZNO prvo pozovi find_student. Pre kreiranja časa, proveri konflikt sa find_lessons_in_window. Pisi kratko, na srpskom (latinica).`;

const TEST_CASES: Array<{ name: string; prompt: string }> = [
  // 1. Read-only — istorija
  {
    name: "Istorija učenika",
    prompt: "Daj mi istoriju za Marka Petrovića poslednjih mesec dana",
  },

  // 2. Write proposal — kreiranje časa
  {
    name: "Kreiranje časa (proposal)",
    prompt:
      "Zakaži čas Marka Petrovića sutra u 17h, 60 minuta, default cena.",
  },

  // 3. Read-only — bilanca
  {
    name: "Provera duga",
    prompt: "Koliko mi Marko Petrović duguje?",
  },

  // 4. Sledeći časovi
  {
    name: "Predstojeći časovi",
    prompt: "Koje časove imam sutra?",
  },

  // 5. Conflict detection
  {
    name: "Conflict detection (kreiranje na zauzet termin)",
    prompt: "Zakaži čas Marka u petak (15. maj) u 17h, 60 min.",
  },

  // 6. Otkazivanje
  {
    name: "Otkazivanje časa (proposal)",
    prompt: "Otkaži Markov sledeći čas, otkazao učenik.",
  },

  // 7. Pomeranje
  {
    name: "Pomeranje termina (proposal)",
    prompt: "Pomeri Markov sledeći čas u sredu u 18h.",
  },

  // 8. Plaćanje
  {
    name: "Upisivanje uplate (proposal)",
    prompt: "Marko mi je platio 6000 dinara keš juče.",
  },

  // 9. Navigacija
  {
    name: "Navigacija na profil",
    prompt: "Otvori mi profil Marka.",
  },

  // 10. Domaći
  {
    name: "Zadavanje domaćeg (proposal)",
    prompt:
      "Zadaj Marku domaći — Vietove formule, strana 165 zadaci 1 do 5, rok do utorka.",
  },

  // 11. Edge: nepostojeći učenik
  {
    name: "Edge: nepostojeći učenik",
    prompt: "Zakaži čas Petra Markovića sutra u 18h.",
  },

  // 12. Aggregation
  {
    name: "Aggregation: ko duguje",
    prompt: "Ko mi sve duguje više od 1000 dinara?",
  },

  // 13. Vague — fali specifika
  {
    name: "Vague request",
    prompt: "Daj mi istoriju.",
  },

  // 14. Datum reasoning
  {
    name: "Datum reasoning (sutra utorak?)",
    prompt: "Šta je danas, dan u nedelji? Koji datum će biti utorak?",
  },
];

// ============================================================
// Single-conversation chat loop (no persistence to DB)
// ============================================================

async function runSingleTurn(userMessage: string, orgId: string) {
  const now = new Date();
  const dateContext = `

TRENUTNI DATUM I VREME:
- Datum: ${format(now, "EEEE, d. MMMM yyyy.", { locale: srLatn })}
- ISO: ${now.toISOString()}
- Vremenska zona: Europe/Belgrade
- Kad računaš "sutra", "u utorak" itd. — koristi ovaj datum.`;

  const system = SYSTEM_PROMPT + dateContext;
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  const events: Array<{
    type: "tool_use" | "tool_result" | "text" | "proposal" | "navigation";
    content: unknown;
  }> = [];

  for (let i = 0; i < 6; i++) {
    const response = await ai.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: [
        {
          type: "text",
          text: system,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: TOOLS,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    const textBlocks = response.content.filter(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );

    for (const t of textBlocks) {
      events.push({ type: "text", content: t.text });
    }

    if (toolUses.length === 0) break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      events.push({ type: "tool_use", content: { name: tu.name, input: tu.input } });
      const r = await executeTool(supabase, orgId, tu.name, tu.input as Record<string, unknown>);
      events.push({ type: "tool_result", content: r });

      // Detect proposals/navigation
      if (r.ok && r.data && typeof r.data === "object") {
        const d = r.data as Record<string, unknown>;
        if (d.proposal) events.push({ type: "proposal", content: d.proposal });
        if (d.navigation) events.push({ type: "navigation", content: d.navigation });
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: JSON.stringify(r),
        is_error: !r.ok,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  return events;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  // Find Milan's org
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, full_name")
    .ilike("full_name", "%Milan%Julinac%")
    .single();
  if (!profile) throw new Error("Milan not found");
  const orgId = profile.organization_id as string;
  console.log(`Testing with org: ${orgId}\n`);

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i]!;
    console.log("\n" + "=".repeat(80));
    console.log(`[${i + 1}/${TEST_CASES.length}] ${tc.name}`);
    console.log("=".repeat(80));
    console.log(`USER: ${tc.prompt}`);

    try {
      const t0 = Date.now();
      const events = await runSingleTurn(tc.prompt, orgId);
      const dur = ((Date.now() - t0) / 1000).toFixed(1);

      let textCount = 0;
      let toolCount = 0;
      let proposalCount = 0;

      for (const ev of events) {
        if (ev.type === "tool_use") {
          toolCount++;
          const c = ev.content as { name: string; input: unknown };
          const inputStr = JSON.stringify(c.input).slice(0, 100);
          console.log(`  → TOOL: ${c.name}(${inputStr})`);
        } else if (ev.type === "tool_result") {
          const c = ev.content as { ok: boolean; data?: unknown; error?: string };
          if (!c.ok) {
            console.log(`    ✗ ERROR: ${c.error}`);
          } else if (c.data && typeof c.data === "object") {
            const d = c.data as Record<string, unknown>;
            // Kratki summary onoga što tool vrati
            if (d.matches) {
              const m = d.matches as Array<{ full_name: string }>;
              console.log(`    ✓ ${m.length} match(es): ${m.map((x) => x.full_name).join(", ")}`);
            } else if (d.lessons) {
              const l = d.lessons as Array<unknown>;
              console.log(`    ✓ ${l.length} lessons`);
            } else if (d.conflicts) {
              const c2 = d.conflicts as Array<{ student_name?: string; date: string }>;
              console.log(`    ✓ ${c2.length} conflicts: ${c2.map((x) => `${x.student_name || "?"} @ ${x.date}`).join(", ")}`);
            } else if (d.debt_para !== undefined) {
              console.log(`    ✓ debt: ${(Number(d.debt_para) / 100).toLocaleString("sr-Latn-RS")} RSD`);
            } else if (d.proposal) {
              const p = d.proposal as { type: string; summary: Record<string, unknown> };
              console.log(`    ✓ PROPOSAL: ${p.type}`);
              for (const [k, v] of Object.entries(p.summary)) {
                console.log(`        ${k}: ${JSON.stringify(v)}`);
              }
            } else if (d.navigation) {
              const n = d.navigation as { path: string };
              console.log(`    ✓ NAVIGATE → ${n.path}`);
            } else if (d.students) {
              const s = d.students as Array<{ full_name: string }>;
              console.log(`    ✓ ${s.length} students`);
            } else {
              console.log(`    ✓ ok`);
            }
          }
        } else if (ev.type === "text") {
          textCount++;
        } else if (ev.type === "proposal") {
          proposalCount++;
        }
      }

      // Final assistant text (poslednji)
      const lastText = events
        .filter((e) => e.type === "text")
        .pop();
      if (lastText) {
        console.log(`\n  ASSISTANT: ${(lastText.content as string).slice(0, 240)}${(lastText.content as string).length > 240 ? "..." : ""}`);
      }

      console.log(
        `\n  STATS: ${toolCount} tool calls, ${textCount} text blocks, ${proposalCount} proposals · ${dur}s`,
      );
    } catch (err) {
      console.log(`  EXCEPTION: ${err instanceof Error ? err.message : err}`);
    }

    // Pauza da ne udarimo rate limit
    await new Promise((r) => setTimeout(r, 800));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
