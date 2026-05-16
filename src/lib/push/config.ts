/**
 * Web Push configuration helpers — used by both server and client to know
 * whether push is wired up (VAPID keys in env). Without the keys the
 * subscribe button stays disabled and the server send is a no-op.
 */

export function getPushPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;
}

export function isPushConfiguredOnServer(): boolean {
  return (
    !!process.env.VAPID_PUBLIC_KEY &&
    !!process.env.VAPID_PRIVATE_KEY &&
    !!process.env.VAPID_SUBJECT
  );
}
