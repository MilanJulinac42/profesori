import type Anthropic from "@anthropic-ai/sdk";
import { format } from "date-fns";
import { srLatn } from "date-fns/locale";
import { NextResponse, type NextRequest } from "next/server";
import {
  ASSISTANT_MODEL,
  getAnthropic,
  isOverloadedError,
} from "@/lib/ai/anthropic";
import { createClient } from "@/lib/supabase/server";
import { TOOLS, executeTool } from "@/lib/assistant/tools";
import { checkAssistantRateLimit } from "@/lib/assistant/rate-limit";
import type { HistoryMessage } from "@/lib/assistant/chat";

export const runtime = "nodejs";
// We stream — never try to render this as a static response.
export const dynamic = "force-dynamic";

const MAX_ITERATIONS = 6;

const SYSTEM_PROMPT = `Ti si AI asistent profesoru privatnih časova u Srbiji. Radiš unutar njihove aplikacije (CRM za solo profesore). Tvoj posao je da pomogneš profesoru sa svim svakodnevnim zadacima — zakazivanjem časova, naplatom, beleskama, izveštajima — kroz prirodni razgovor.

PLATFORMA — SITEMAP (znaš tačno gde se šta nalazi):

GLAVNA NAVIGACIJA (sidebar):
- /dashboard — "Pregled" — početna stranica sa hero karticom (datum, brojevi), heatmap aktivnosti, "Postavi platformu" widget za onboarding, sledeći časovi, pending zadaci, recent activity.
- /students — "Učenici" — lista svih učenika sa statusom (aktivan/pauziran/arhiviran), filter pretraga.
  · /students/new — dodavanje novog učenika (ime, predmet, razred, kontakt roditelja)
  · /students/[id] — kartica učenika (svi časovi, beleške, naplata, domaći, izveštaji)
  · /students/[id]/edit — uređivanje učenika
  · /students/[id]/bill — naplata po učeniku
  · /students/[id]/yearbook — godišnjak učenika (overview kroz vreme)
- /schedule — "Raspored" — kalendar časova, kreiranje pojedinačnih ili ponavljajućih (weekly slots).
- /billing — "Naplata" — pregled uplata, dugovanja, izveštaj po mesecu.
- /exercises — "Zadaci" — AI generator zadataka iz matematike (i drugih predmeta).
  · /exercises/new — kreiranje novog zadatka kroz AI prompt
  · /exercises/[id] — pregled generisanog zadatka
  · /exercises/[id]/print — verzija za štampanje
- /poruke — "Poruke" — bulk slanje poruka roditeljima/učenicima (WhatsApp, email, SMS preko share linka).
  · /poruke/parser — parser za poruke iz drugih izvora
- /asistent — "Asistent" — pun chat sa AI asistentom (ovaj si ti, u proširenom prikazu).
- /profile/inbox — "Upiti" — primljeni upiti od roditelja preko javnog profila.
- /profile — "Javni profil" — uređivanje javne stranice profesora.
- /settings — "Podešavanja" — VAŽNO, ovde se nalazi:
  · POVEZIVANJE GOOGLE KALENDARA (kartica "Google Calendar" — klik na "Poveži Google nalog" pokreće OAuth flow, posle izabere se kalendar u koji se sinhronizuju časovi)
  · Podaci profesora (ime, telefon, email)
  · Cenovnik (default cena po času, valuta)
  · Notification preferences
  · Trial / subscription status

OSTALE RUTE (ne u sidebar-u):
- /lessons/[id]/note — beleška za konkretan čas
- /reports/[id] — izveštaj o učeniku za određeni period
- /reports/[id]/print — print verzija izveštaja

JAVNE STRANE (otvorene bez login-a):
- /p/[slug] — javni profil profesora
- /h/[token] — parent portal za jednog učenika
- /r/[token] — pojedinačni izveštaj/domaći link za roditelja

KAKO FUNKCIONIŠEŠ:

1. Imaš set ALATA (tools). Koristi ih kad ti trebaju podaci ili kad želiš da predložiš akciju.
2. Za bilo šta vezano za konkretnog učenika, OBAVEZNO prvo pozovi find_student da nađeš id, pa onda druge alate sa tim id-em.
3. Pre nego što PREDLOŽIŠ kreiranje časa, pozovi find_lessons_in_window da proveriš da nema kolizije.
4. navigate_to NIKAD ne pozivaj bez potvrde — pogledaj sekciju "NAVIGACIJA" ispod.
5. Pisi na srpskom (latinica), profesionalno ali toplo, kratko i konkretno.
6. Brojeve novca prikazuj u RSD (1500 RSD), ne u parama.
7. Datumi i vremena: koristi prirodan srpski format ("utorak, 14. maja u 17h").

NAVIGACIJA (kritično — nikad ne preusmeravaj bez potvrde):
- navigate_to POMERA korisnika sa stranice gde trenutno radi — to je destruktivna akcija po toku rada.
- ZATO: NIKAD ne pozivaj navigate_to u istom odgovoru u kome odgovaraš na pitanje "gde je X". Prvo objasni gde je, pa pitaj: "Hoćeš da te odbacim tamo?".
- Tek u SLEDEĆEM turn-u, ako korisnik kaže "da", "može", "ajde", "vodi me" itd. — TEK ONDA pozovi navigate_to.
- Ako kaže "ne", "ne treba", "samo mi reci" — NEMOJ pozvati navigate_to, samo potvrdi.
- Izuzetak: ako je korisnik eksplicitno tražio "otvori mi X", "vodi me na X" — to je već potvrda.

VAŽNO ZA PREDLOGE AKCIJA (propose_*):
- Tools koji počinju sa "propose_" NE izvršavaju ništa — samo pripremaju proposal.
- Posle propose_ tool poziva, tvoj sledeći odgovor TREBA da kratko objasni predlog i pita korisnika za potvrdu. Frontend će pokazati confirmation card sa Da/Ne dugmićima.
- Ako korisnik nije specifikovao cenu, koristi default sa profila učenika (price_para: 0 → biraj automatski).
- Ako korisnik nije specifikovao trajanje, koristi 60 min ili default sa profila.

BUDI EFIKASAN:
- Ne objašnjavaj kako radiš tools — samo ih koristi i daj rezultat.
- Ne ponavljaj poslednju poruku korisnika.
- Ako ti nešto nedostaje, kratko pitaj. Ne pravi pretpostavke o važnim stvarima (datumi, iznosi).`;

type ChatRequestBody = {
  history?: HistoryMessage[];
  userMessage?: string;
  pageContext?: { path: string; description?: string };
};

export async function POST(request: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON." }, { status: 400 });
  }

  const history = Array.isArray(body.history) ? body.history : [];
  const userMessage = (body.userMessage ?? "").trim();
  if (!userMessage) {
    return NextResponse.json({ error: "Poruka je prazna." }, { status: 400 });
  }

  // Auth — manual so we can return 401 instead of redirect HTML.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nisi prijavljen." }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("users")
    .select(
      "id, organization_id, organizations(id, slug, subscription_tier, subscription_status, trial_ends_at)",
    )
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "Profil nije nađen." }, { status: 401 });
  }
  const organizationId = (profile as { organization_id: string })
    .organization_id;

  // Rate-limit before doing any work. The Anthropic call is the expensive
  // bit; we want to refuse before issuing it.
  const rateCheck = await checkAssistantRateLimit(user.id);
  if (!rateCheck.ok) {
    return NextResponse.json(
      { error: rateCheck.message },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
      },
    );
  }

  // System prompt + date + page context.
  const now = new Date();
  const dateContext = [
    ``,
    `TRENUTNI DATUM I VREME (na ovome se zasnivaju svi relativni izrazi tipa "danas", "sutra", "u utorak", "sledeća nedelja"):`,
    `- Datum: ${format(now, "EEEE, d. MMMM yyyy.", { locale: srLatn })}`,
    `- Vreme: ${format(now, "HH:mm")}`,
    `- ISO: ${now.toISOString()}`,
    `- Vremenska zona: Europe/Belgrade`,
    ``,
    `Kad računaš "sutra", "u utorak" itd. — koristi ovaj datum kao polaznu tačku. NIKAD ne pitaj korisnika za današnji datum.`,
  ].join("\n");

  let system = SYSTEM_PROMPT + dateContext;
  if (body.pageContext) {
    system += `\n\nKONTEKST: Profesor je trenutno na stranici "${body.pageContext.path}"${
      body.pageContext.description
        ? ` (${body.pageContext.description})`
        : ""
    }. Koristi to kao kontekst ako korisnik kaže "ovaj učenik" ili sl.`;
  }

  const newTurns: HistoryMessage[] = [];
  const userTurn: HistoryMessage = { role: "user", content: userMessage };
  newTurns.push(userTurn);
  const apiHistory: Anthropic.MessageParam[] = [...history, userTurn];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      const send = (event: Record<string, unknown>) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          // controller already closed
        }
      };

      try {
        const client = getAnthropic();
        let lastProposal: unknown = undefined;
        let lastNavigation: { path: string; reason?: string } | undefined =
          undefined;

        for (let i = 0; i < MAX_ITERATIONS; i++) {
          const turnStream = await callStreamWithFallback(client, {
            system,
            messages: apiHistory,
            onText: (delta) => send({ type: "text", delta }),
          });

          const final = await turnStream.finalMessage();

          // Tell the client this assistant turn is fully done; gives the UI a
          // hint to lock in whatever text it has and reset for any next turn.
          send({ type: "turn_complete" });

          const assistantTurn: HistoryMessage = {
            role: "assistant",
            content: final.content,
          };
          newTurns.push(assistantTurn);
          apiHistory.push(assistantTurn);

          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );
          if (toolUses.length === 0) break;

          // Execute each tool. Notify client so it can show transparent
          // status (no UI for now beyond keepalive).
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            send({ type: "tool_call", name: tu.name });
            const result = await executeTool(
              supabase,
              organizationId,
              tu.name,
              (tu.input as Record<string, unknown>) ?? {},
            );
            send({ type: "tool_done", name: tu.name, ok: result.ok });

            if (result.ok && result.data && typeof result.data === "object") {
              const dataObj = result.data as Record<string, unknown>;
              if (dataObj.proposal) lastProposal = dataObj.proposal;
              if (dataObj.navigation) {
                lastNavigation = dataObj.navigation as {
                  path: string;
                  reason?: string;
                };
              }
            }

            toolResults.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: JSON.stringify(result),
              is_error: !result.ok,
            });
          }

          const toolTurn: HistoryMessage = {
            role: "user",
            content: toolResults,
          };
          newTurns.push(toolTurn);
          apiHistory.push(toolTurn);
        }

        send({
          type: "done",
          newTurns,
          proposal: lastProposal,
          navigation: lastNavigation,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Greška.";
        send({
          type: "error",
          error: /529|overloaded/i.test(msg)
            ? "AI je preopterećen. Pokušaj ponovo za par sekundi."
            : msg,
        });
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

async function callStreamWithFallback(
  client: Anthropic,
  args: {
    system: string;
    messages: Anthropic.MessageParam[];
    onText: (delta: string) => void;
  },
) {
  const open = (model: string) => {
    const s = client.messages.stream({
      model,
      max_tokens: 2000,
      system: [
        {
          type: "text",
          text: args.system,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: TOOLS,
      messages: args.messages,
    });
    s.on("text", args.onText);
    return s;
  };

  // If the primary model is overloaded the SDK surfaces it via the stream's
  // error/done lifecycle. We catch in the outer route handler. For mid-stream
  // errors we'd ideally restart on Sonnet, but a half-emitted text stream
  // can't easily be replayed — for now, just propagate.
  try {
    return open(ASSISTANT_MODEL);
  } catch (err) {
    if (isOverloadedError(err)) return open("claude-sonnet-4-6");
    throw err;
  }
}
