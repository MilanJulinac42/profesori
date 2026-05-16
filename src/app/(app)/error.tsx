"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Fallback for errors thrown inside an authenticated route. The (app) layout
 * (sidebar, topbar, assistant) stays mounted around this body.
 */
export default function AppError({
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
    <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl tile-rose mx-auto">
          <AlertCircle className="size-6" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
            Greška
          </p>
          <h1 className="font-display text-2xl text-foreground mt-2">
            Ovo nije moglo da se učita.
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Greška je prijavljena. Probaj ponovo — ako se ponovi, otvori
            drugu stranicu pa se vrati.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all"
          >
            <RotateCcw className="size-3.5" strokeWidth={2} />
            Pokušaj ponovo
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-card border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.75} />
            Na dashboard
          </Link>
        </div>
        {error.digest && (
          <p className="text-[11px] text-muted-foreground/60 font-mono">
            {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
