import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side rate limit for the AI assistant chat endpoint. Counts rows in
 * the `assistant_rate_limit` table within the last hour and minute; rejects
 * if either bucket exceeds its budget.
 *
 * Limits chosen for an active solo teacher:
 *   - 60 calls / hour  → typical heavy day is well under this
 *   - 10 calls / minute → catches runaway loops / hot retries
 */

const HOUR_LIMIT = 60;
const MINUTE_LIMIT = 10;

export type RateLimitDecision =
  | { ok: true }
  | {
      ok: false;
      reason: "minute" | "hour";
      retryAfterSeconds: number;
      message: string;
    };

export async function checkAssistantRateLimit(
  userId: string,
): Promise<RateLimitDecision> {
  const supabase = createAdminClient();
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const minuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();

  const [{ count: minuteCount }, { count: hourCount }] = await Promise.all([
    supabase
      .from("assistant_rate_limit")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("called_at", minuteAgo),
    supabase
      .from("assistant_rate_limit")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("called_at", hourAgo),
  ]);

  if ((minuteCount ?? 0) >= MINUTE_LIMIT) {
    return {
      ok: false,
      reason: "minute",
      retryAfterSeconds: 60,
      message:
        "Šalješ poruke prebrzo. Sačekaj minut pa probaj ponovo.",
    };
  }

  if ((hourCount ?? 0) >= HOUR_LIMIT) {
    return {
      ok: false,
      reason: "hour",
      retryAfterSeconds: 60 * 30,
      message:
        "Stigao si limit za asistenta za ovaj sat. Pokušaj za pola sata.",
    };
  }

  // Record this call. Fire-and-forget: even if this fails, we don't want to
  // block the actual chat response. The next call will see a slightly stale
  // count which is acceptable.
  void supabase
    .from("assistant_rate_limit")
    .insert({ user_id: userId, called_at: now.toISOString() });

  return { ok: true };
}

/**
 * Prune rate-limit rows older than 24h. Optionally called from a cron route
 * or after each request (with rare sampling). Not wired by default —
 * Postgres handles the table fine until ~100k rows even unpruned.
 */
export async function pruneOldRateLimitRows(): Promise<void> {
  const supabase = createAdminClient();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("assistant_rate_limit")
    .delete()
    .lt("called_at", dayAgo);
}
