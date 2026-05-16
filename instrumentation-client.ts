import * as Sentry from "@sentry/nextjs";

/**
 * Client-side Sentry init. Loaded by Next 16 automatically.
 *
 * No DSN → no-op. Safe to ship without a Sentry account.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Session replay is bandwidth-heavy and personal — opt in later if useful.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  });
}

export const onRouterTransitionStart =
  Sentry.captureRouterTransitionStart;
