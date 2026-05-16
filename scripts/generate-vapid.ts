/**
 * One-shot helper that prints a VAPID key pair to stdout.
 *
 *   npx tsx scripts/generate-vapid.ts
 *
 * Copy the printed values into env (.env.local + Vercel):
 *   VAPID_PUBLIC_KEY  (also as NEXT_PUBLIC_VAPID_PUBLIC_KEY)
 *   VAPID_PRIVATE_KEY (server only — never expose)
 *   VAPID_SUBJECT     ("mailto:you@example.com" or your domain URL)
 *
 * Without these env vars set, web push is silently disabled — the
 * subscribe toggle in /settings shows an explanatory disabled state.
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("# Add these to .env.local and Vercel env (Production + Preview):");
console.log("");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:you@yourdomain.com`);
console.log("");
console.log("# VAPID_SUBJECT must be a mailto: URL or https:// URL.");
