"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Fallback for the public profile page. We don't link back into the app
 * (anonymous visitors don't have one).
 */
export default function PublicProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-background text-foreground">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
          Greška
        </p>
        <h1 className="font-display text-2xl">
          Profil trenutno nije dostupan.
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Probaj ponovo za par sekundi.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all"
        >
          Pokušaj ponovo
        </button>
      </div>
    </main>
  );
}
