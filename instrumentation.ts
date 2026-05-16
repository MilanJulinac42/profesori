import * as Sentry from "@sentry/nextjs";

/**
 * Server + edge runtime Sentry init. Called once per Next.js boot.
 *
 * No DSN → Sentry no-ops, so this is safe to commit even if the project
 * doesn't have a Sentry account yet. Add SENTRY_DSN to .env to enable.
 */
export function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      // Don't leak the assistant chat body into errors — it can contain
      // personal teacher/student data.
      sendDefaultPii: false,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    });
  }
}

/**
 * Sentry's helper for capturing nested-route errors. Required since Next 15
 * to surface server-component throws.
 */
export const onRequestError = Sentry.captureRequestError;
