import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY nije podešen. Dodaj ga u .env.local.",
      );
    }
    // 529 (overloaded) i 5xx greške se retry-uju automatski sa
    // eksponencijalnim backoff-om. Bumpovan default 2 → 5 jer Anthropic
    // ume da bude preopterećen u špicu (529).
    client = new Anthropic({ apiKey, maxRetries: 5 });
  }
  return client;
}

/** Za generisanje zadataka — treba Sonnet jer su matematika/format zahtevni. */
export const EXERCISE_MODEL = "claude-sonnet-4-6";

/**
 * Za AI asistenta (chat + tools) — Haiku je dovoljno pametan, brži je
 * (~3x) i jeftiniji. Tool round-trip se završi za 2-3s umesto 6-8s.
 */
export const ASSISTANT_MODEL = "claude-haiku-4-5";

/** Manji/jeftiniji model — fallback kad je primary preopterećen (529). */
export const FALLBACK_MODEL = "claude-haiku-4-5";

/** Heuristika: da li je greška Anthropic 529 / overloaded. */
export function isOverloadedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /529|overloaded/i.test(msg);
}
