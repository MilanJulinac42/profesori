"use server";

import Anthropic from "@anthropic-ai/sdk";
import { format } from "date-fns";
import { srLatn } from "date-fns/locale";
import {
  ASSISTANT_MODEL,
  getAnthropic,
  isOverloadedError,
} from "@/lib/ai/anthropic";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { TOOLS, executeTool } from "./tools";

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
- /profile — "Javni profil" — uređivanje javne stranice profesora (sekcije, predmeti, FAQ, video, fotke). Tu se profil objavljuje/skida.
- /settings — "Podešavanja" — VAŽNO, ovde se nalazi:
  · POVEZIVANJE GOOGLE KALENDARA (kartica "Google Calendar" — klik na "Poveži Google nalog" pokreće OAuth flow, posle izabere se kalendar u koji se sinhronizuju časovi)
  · Podaci profesora (ime, telefon, email)
  · Cenovnik (default cena po času, valuta)
  · Notification preferences
  · Trial / subscription status

OSTALE RUTE (ne u sidebar-u):
- /lessons/[id]/note — beleška za konkretan čas (otvara se iz kartice učenika ili sa rasporeda)
- /reports/[id] — izveštaj o učeniku za određeni period
- /reports/[id]/print — print verzija izveštaja

JAVNE STRANE (otvorene bez login-a):
- /p/[slug] — javni profil profesora (vide ga potencijalni učenici/roditelji)
- /h/[token] — parent portal za jednog učenika (token-based, bez login-a, roditelj prati progres)
- /r/[token] — pojedinačni izveštaj/domaći link za roditelja

KAKO FUNKCIONIŠEŠ:

1. Imaš set ALATA (tools). Koristi ih kad ti trebaju podaci ili kad želiš da predložiš akciju.
2. Za bilo šta vezano za konkretnog učenika, OBAVEZNO prvo pozovi find_student da nađeš id, pa onda druge alate sa tim id-em.
3. Pre nego što PREDLOŽIŠ kreiranje časa, pozovi find_lessons_in_window da proveriš da nema kolizije.
4. navigate_to NIKAD ne pozivaj bez potvrde — pogledaj sekciju "NAVIGACIJA" ispod.
5. Pisi na srpskom (latinica), profesionalno ali toplo, kratko i konkretno.
6. Brojeve novca prikazuj u RSD (1500 RSD), ne u parama.
7. Datumi i vremena: koristi prirodan srpski format ("utorak, 14. maja u 17h").

VAŽNO ZA "GDE JE X" PITANJA:
- Ako te pita "gde mogu da povežem Google kalendar" → odgovori KONKRETNO: "U Podešavanjima — kartica 'Google Calendar', klikni 'Poveži Google nalog'." Pa ponudi: "Hoćeš da te odbacim na Podešavanja?"
- Ako te pita "gde dodajem učenika" → /students/new, ili sa /students stranice dugme "Novi učenik".
- Ako te pita "kako da zakažem čas" → /schedule, ili sa kartice učenika dugme "Zakaži čas".
- Ako te pita "gde su mi domaći" / "gde vidim ko duguje" / itd. — uvek daj tačnu rutu iz sitemap-a.
- NIKAD ne reci "možda nije dostupno" — sve funkcije sa sitemap-a SU dostupne. Ako baš ne znaš, kaži "proveri u /settings" ili odgovarajuću sekciju, ne izvini se i nemoj reći "nije implementirano".

NAVIGACIJA (kritično — nikad ne preusmeravaj bez potvrde):
- navigate_to POMERA korisnika sa stranice gde trenutno radi — to je destruktivna akcija po toku rada.
- ZATO: NIKAD ne pozivaj navigate_to u istom odgovoru u kome odgovaraš na pitanje "gde je X". Prvo objasni gde je, pa pitaj: "Hoćeš da te odbacim tamo?" ili "Da te odvedem na tu stranicu?".
- Tek u SLEDEĆEM turn-u, ako korisnik kaže "da", "može", "ajde", "vodi me", "okej" itd. — TEK ONDA pozovi navigate_to.
- Ako kaže "ne", "ne treba", "samo mi reci" — NEMOJ pozvati navigate_to, samo potvrdi ("OK, ostaješ gde si.").
- Izuzetak: ako je korisnik eksplicitno tražio "otvori mi X", "vodi me na X", "pređi na X" — to je već potvrda, možeš odmah pozvati navigate_to.

VAŽNO ZA PREDLOGE AKCIJA (propose_*):
- Tools koji počinju sa "propose_" NE izvršavaju ništa — samo pripremaju proposal.
- Posle propose_ tool poziva, tvoj sledeći odgovor TREBA da kratko objasni predlog i pita korisnika za potvrdu, npr. "Da kreiram čas Marka u utorak u 17h za 3000 RSD?". Frontend će pokazati confirmation card sa Da/Ne dugmićima — ne moraš ti to da pravis.
- Ako korisnik nije specifikovao cenu, koristi default sa profila učenika (price_para: 0 → biraj automatski).
- Ako korisnik nije specifikovao trajanje, koristi 60 min ili default sa profila.

BUDI EFIKASAN:
- Ne objašnjavaj kako radiš tools — samo ih koristi i daj rezultat.
- Ne ponavljaj poslednju poruku korisnika.
- Ako ti nešto nedostaje, kratko pitaj. Ne pravi pretpostavke o važnim stvarima (datumi, iznosi).`;

/**
 * Chat history is now owned entirely by the client (localStorage). The server
 * is stateless w.r.t. conversations — it only receives the prior history,
 * runs the model + tool loop, and returns the new turns to append.
 */
export type HistoryMessage = {
  role: "user" | "assistant";
  content: Anthropic.MessageParam["content"];
};

export type ChatResult =
  | {
      ok: true;
      /** Turns to append to the client history, in order: the new user
       *  message, any intermediate tool-use rounds, and the final
       *  assistant reply. */
      newTurns: HistoryMessage[];
      /** Convenience: the LAST assistant turn's content blocks. */
      assistantMessage: Array<Anthropic.ContentBlock>;
      /** Extracted proposal payload, if the last tool was a propose_*. */
      proposal?: unknown;
      /** Extracted navigation, if the last tool was navigate_to. */
      navigation?: { path: string; reason?: string };
    }
  | { ok: false; error: string };

export async function sendChatMessage(input: {
  history: HistoryMessage[];
  userMessage: string;
  pageContext?: { path: string; description?: string };
}): Promise<ChatResult> {
  try {
    const { profile } = await requireUser();
    // Supabase client still needed — tools (find_student, find_lessons_in_window,
    // etc.) read live data scoped to the teacher's organization.
    const supabase = await createClient();

    if (!input.userMessage.trim()) {
      return { ok: false, error: "Poruka je prazna." };
    }

    const newTurns: HistoryMessage[] = [];

    // Append the user's new message.
    const userTurn: HistoryMessage = {
      role: "user",
      content: input.userMessage,
    };
    newTurns.push(userTurn);

    // Working history for the Anthropic call — prior client history plus new
    // user message plus any intermediate tool turns we accumulate below.
    const apiHistory: Anthropic.MessageParam[] = [...input.history, userTurn];

    // System prompt + current date + optional page context.
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

    if (input.pageContext) {
      system += `\n\nKONTEKST: Profesor je trenutno na stranici "${input.pageContext.path}"${
        input.pageContext.description
          ? ` (${input.pageContext.description})`
          : ""
      }. Koristi to kao kontekst ako korisnik kaže "ovaj učenik" ili sl.`;
    }

    const client = getAnthropic();

    // ============================================================
    // Tool-use loop — stateless, no DB writes for chat
    // ============================================================
    let lastResponse: Anthropic.Message | null = null;
    let lastProposal: unknown = undefined;
    let lastNavigation: { path: string; reason?: string } | undefined =
      undefined;
    const MAX_ITERATIONS = 6;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      lastResponse = await callModelWithFallback(client, {
        system,
        messages: apiHistory,
      });

      const assistantTurn: HistoryMessage = {
        role: "assistant",
        content: lastResponse.content,
      };
      newTurns.push(assistantTurn);
      apiHistory.push(assistantTurn);

      const toolUses = lastResponse.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      if (toolUses.length === 0) break;

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const tu of toolUses) {
        const result = await executeTool(
          supabase,
          profile.organization_id,
          tu.name,
          (tu.input as Record<string, unknown>) ?? {},
        );

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

      // Tool results are sent back as a "user" role turn in Anthropic format.
      const toolTurn: HistoryMessage = {
        role: "user",
        content: toolResults,
      };
      newTurns.push(toolTurn);
      apiHistory.push(toolTurn);
    }

    if (!lastResponse) {
      return { ok: false, error: "Nije bilo response-a." };
    }

    return {
      ok: true,
      newTurns,
      assistantMessage: lastResponse.content,
      proposal: lastProposal,
      navigation: lastNavigation,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Greška.";
    if (/529|overloaded/i.test(msg)) {
      return {
        ok: false,
        error: "AI je preopterećen. Pokušaj ponovo za par sekundi.",
      };
    }
    return { ok: false, error: msg };
  }
}

async function callModelWithFallback(
  client: Anthropic,
  args: {
    system: string;
    messages: Anthropic.MessageParam[];
  },
): Promise<Anthropic.Message> {
  const callWith = (model: string) =>
    client.messages.create({
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

  try {
    return await callWith(ASSISTANT_MODEL);
  } catch (err) {
    if (isOverloadedError(err)) return await callWith("claude-sonnet-4-6");
    throw err;
  }
}

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
       *  knows the proposal was confirmed when the next message is sent. */
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
