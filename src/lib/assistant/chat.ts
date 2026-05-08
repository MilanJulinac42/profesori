"use server";

import Anthropic from "@anthropic-ai/sdk";
import { format } from "date-fns";
import { srLatn } from "date-fns/locale";
import {
  EXERCISE_MODEL,
  FALLBACK_MODEL,
  getAnthropic,
  isOverloadedError,
} from "@/lib/ai/anthropic";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { TOOLS, executeTool } from "./tools";

const SYSTEM_PROMPT = `Ti si AI asistent profesoru privatnih časova u Srbiji. Radiš unutar njihove aplikacije (CRM za solo profesore). Tvoj posao je da pomogneš profesoru sa svim svakodnevnim zadacima — zakazivanjem časova, naplatom, beleskama, izveštajima — kroz prirodni razgovor.

KAKO FUNKCIONIŠEŠ:

1. Imaš set ALATA (tools). Koristi ih kad ti trebaju podaci ili kad želiš da predložiš akciju.
2. Za bilo šta vezano za konkretnog učenika, OBAVEZNO prvo pozovi find_student da nađeš id, pa onda druge alate sa tim id-em.
3. Pre nego što PREDLOŽIŠ kreiranje časa, pozovi find_lessons_in_window da proveriš da nema kolizije.
4. Kad korisnik traži da otvoriš stranicu/profil — koristi navigate_to.
5. Pisi na srpskom (latinica), profesionalno ali toplo, kratko i konkretno.
6. Brojeve novca prikazuj u RSD (1500 RSD), ne u parama.
7. Datumi i vremena: koristi prirodan srpski format ("utorak, 14. maja u 17h").

VAŽNO ZA PREDLOGE AKCIJA (propose_*):
- Tools koji počinju sa "propose_" NE izvršavaju ništa — samo pripremaju proposal.
- Posle propose_ tool poziva, tvoj sledeći odgovor TREBA da kratko objasni predlog i pita korisnika za potvrdu, npr. "Da kreiram čas Marka u utorak u 17h za 3000 RSD?". Frontend će pokazati confirmation card sa Da/Ne dugmićima — ne moraš ti to da pravis.
- Ako korisnik nije specifikovao cenu, koristi default sa profila učenika (price_para: 0 → biraj automatski).
- Ako korisnik nije specifikovao trajanje, koristi 60 min ili default sa profila.

BUDI EFIKASAN:
- Ne objašnjavaj kako radiš tools — samo ih koristi i daj rezultat.
- Ne ponavljaj poslednju poruku korisnika.
- Ako ti nešto nedostaje, kratko pitaj. Ne pravi pretpostavke o važnim stvarima (datumi, iznosi).`;

export type ChatMessage = {
  role: "user" | "assistant" | "tool";
  content: Anthropic.MessageParam["content"];
};

export type ChatResult =
  | {
      ok: true;
      conversationId: string;
      assistantMessage: Array<Anthropic.ContentBlock>;
      /** Ako poslednji tool poziv vraća proposal, ovo je ekstrahovan payload za UI. */
      proposal?: unknown;
      /** Ako poslednji tool poziv je navigate_to. */
      navigation?: { path: string; reason?: string };
    }
  | { ok: false; error: string };

export async function sendChatMessage(input: {
  conversationId?: string;
  userMessage: string;
  pageContext?: { path: string; description?: string };
}): Promise<ChatResult> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();

    if (!input.userMessage.trim()) {
      return { ok: false, error: "Poruka je prazna." };
    }

    // Resolve ili kreiraj konverzaciju
    let conversationId = input.conversationId;
    if (!conversationId) {
      const { data: conv, error: convErr } = await supabase
        .from("assistant_conversations")
        .insert({
          organization_id: profile.organization_id,
          user_id: profile.id,
          title: input.userMessage.slice(0, 80),
        })
        .select("id")
        .single();
      if (convErr || !conv) {
        return { ok: false, error: convErr?.message ?? "Greška." };
      }
      conversationId = conv.id as string;
    }

    // Učitaj postojeće poruke
    const { data: existingMessages } = await supabase
      .from("assistant_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    const history: Anthropic.MessageParam[] = ((existingMessages ?? []) as Array<{
      role: "user" | "assistant" | "tool";
      content: Anthropic.MessageParam["content"];
    }>).map((m) => ({
      role: m.role === "tool" ? "user" : (m.role as "user" | "assistant"),
      content: m.content,
    }));

    // Dodaj novu user poruku
    const userContent: Anthropic.MessageParam["content"] = input.userMessage;
    history.push({ role: "user", content: userContent });

    // Save user message
    await supabase.from("assistant_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: userContent,
    });

    // System prompt + trenutni datum + opciono page context.
    // Datum mora biti u system prompt-u jer AI ne zna "today" inače.
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
        input.pageContext.description ? ` (${input.pageContext.description})` : ""
      }. Koristi to kao kontekst ako korisnik kaže "ovaj učenik" ili sl.`;
    }

    const client = getAnthropic();

    // ============================================================
    // Tool-use loop
    // ============================================================
    let lastResponse: Anthropic.Message | null = null;
    let lastProposal: unknown = undefined;
    let lastNavigation: { path: string; reason?: string } | undefined = undefined;
    const MAX_ITERATIONS = 6;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      lastResponse = await callModelWithFallback(client, {
        system,
        messages: history,
      });

      // Save assistant message
      await supabase.from("assistant_messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: lastResponse.content as unknown,
        input_tokens: lastResponse.usage.input_tokens,
        output_tokens: lastResponse.usage.output_tokens,
        cache_read_tokens: lastResponse.usage.cache_read_input_tokens ?? 0,
        cache_creation_tokens: lastResponse.usage.cache_creation_input_tokens ?? 0,
      });

      history.push({ role: "assistant", content: lastResponse.content });

      // Da li model poziva tool-ove?
      const toolUses = lastResponse.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      if (toolUses.length === 0) break; // model je završio sa tekstom

      // Izvrši tool-ove
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const tu of toolUses) {
        const result = await executeTool(
          supabase,
          profile.organization_id,
          tu.name,
          (tu.input as Record<string, unknown>) ?? {},
        );

        // Ako je proposal, sačuvaj za UI
        if (result.ok && result.data && typeof result.data === "object") {
          const dataObj = result.data as Record<string, unknown>;
          if (dataObj.proposal) {
            lastProposal = dataObj.proposal;
          }
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

      // Save tool result kao "tool" role poruka
      await supabase.from("assistant_messages").insert({
        conversation_id: conversationId,
        role: "tool",
        content: toolResults as unknown,
      });

      // Dodaj tool_results u history (kao user message — Anthropic format)
      history.push({ role: "user", content: toolResults });
    }

    if (!lastResponse) {
      return { ok: false, error: "Nije bilo response-a." };
    }

    return {
      ok: true,
      conversationId,
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
    return await callWith(EXERCISE_MODEL);
  } catch (err) {
    if (isOverloadedError(err)) return await callWith(FALLBACK_MODEL);
    throw err;
  }
}

// ============================================================
// Confirm proposal — frontend poziva ovo posle korisničkog Yes
// ============================================================

export type ExecuteProposalInput = {
  conversationId: string;
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

export async function executeProposalAction(
  input: ExecuteProposalInput,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
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

    // Snimi confirmation u konverzaciju kao "user" poruku za istoriju
    await supabase.from("assistant_messages").insert({
      conversation_id: input.conversationId,
      role: "user",
      content: `[Korisnik je potvrdio: ${input.proposal.type}]`,
    });
    await supabase.from("assistant_messages").insert({
      conversation_id: input.conversationId,
      role: "assistant",
      content: [{ type: "text", text: `✓ ${resultMessage}` }] as unknown,
    });

    return { ok: true, message: resultMessage };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}

// ============================================================
// Pomoćne queries za frontend
// ============================================================

export async function loadConversation(conversationId: string): Promise<
  | {
      ok: true;
      messages: Array<{
        id: string;
        role: "user" | "assistant" | "tool";
        content: unknown;
      }>;
    }
  | { ok: false; error: string }
> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("assistant_messages")
      .select("id, role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      messages: ((data ?? []) as Array<{
        id: string;
        role: "user" | "assistant" | "tool";
        content: unknown;
      }>),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}

export async function listRecentConversations(limit = 10): Promise<
  | {
      ok: true;
      conversations: Array<{ id: string; title: string | null; updated_at: string }>;
    }
  | { ok: false; error: string }
> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("assistant_conversations")
      .select("id, title, updated_at")
      .eq("user_id", profile.id)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      conversations: (data ?? []) as Array<{
        id: string;
        title: string | null;
        updated_at: string;
      }>,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}
