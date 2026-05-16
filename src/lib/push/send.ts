/**
 * Server-only helper that sends a Web Push to all of a user's subscribed
 * devices. Imports the `web-push` package lazily so the bundle isn't
 * affected on builds where push is disabled.
 *
 * If VAPID env is missing → no-op (logs a warning once). If a subscription
 * returns 404/410, it's pruned from the DB.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { isPushConfiguredOnServer } from "./config";

export type PushPayload = {
  title: string;
  body: string;
  url?: string; // route to open on click
  tag?: string; // collapse identifier (replaces previous with same tag)
};

let warnedMissing = false;

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!isPushConfiguredOnServer()) {
    if (!warnedMissing) {
      console.warn(
        "[push] VAPID env not set — push notifications are disabled.",
      );
      warnedMissing = true;
    }
    return;
  }

  const webpushMod = await import("web-push").catch(() => null);
  if (!webpushMod) return;
  const webpush = webpushMod.default ?? webpushMod;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  const subs = (data ?? []) as Array<{
    id: number;
    endpoint: string;
    p256dh: string;
    auth: string;
  }>;
  if (subs.length === 0) return;

  const json = JSON.stringify(payload);
  const prunable: number[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          json,
          { TTL: 3600 },
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          prunable.push(s.id);
        } else {
          console.warn("[push] send failed:", err);
        }
      }
    }),
  );

  if (prunable.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", prunable);
  }
}

/**
 * Notify every member of an org. For booking notifications etc — we want
 * the teacher to get the alert regardless of which org user is on.
 */
export async function sendPushToOrg(
  organizationId: string,
  payload: PushPayload,
): Promise<void> {
  if (!isPushConfiguredOnServer()) return;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("organization_id", organizationId);
  const userIds = (data ?? []).map((u) => (u as { id: string }).id);
  await Promise.all(userIds.map((id) => sendPushToUser(id, payload)));
}
