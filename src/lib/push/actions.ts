"use server";

import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export type SubscribePayload = {
  endpoint: string;
  /** Web Push keys returned by PushSubscription.toJSON().keys */
  keys: { p256dh: string; auth: string };
  userAgent?: string;
};

export async function subscribeToPushAction(
  input: SubscribePayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { authUser } = await requireUser();
    const supabase = await createClient();

    if (!input.endpoint || !input.keys?.p256dh || !input.keys?.auth) {
      return { ok: false, error: "Neispravan subscription payload." };
    }

    // Upsert on endpoint — same browser re-subscribing reuses the row.
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: authUser.id,
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          user_agent: input.userAgent ?? null,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}

export async function unsubscribeFromPushAction(
  endpoint: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { authUser } = await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", authUser.id)
      .eq("endpoint", endpoint);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}

/** Whether the calling user has any active push subscriptions. */
export async function hasPushSubscriptionAction(): Promise<{
  ok: true;
  subscribed: boolean;
}> {
  const { authUser } = await requireUser();
  const supabase = await createClient();
  const { count } = await supabase
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", authUser.id);
  return { ok: true, subscribed: (count ?? 0) > 0 };
}
