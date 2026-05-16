import Link from "next/link";
import { Sparkles, ArrowRight, X } from "lucide-react";

/**
 * Sticky banner shown at the top of every /demo page making it clear this
 * isn't a live account + offering the upgrade path with a single click.
 */
export function DemoBanner() {
  return (
    <div className="sticky top-0 z-50 bg-foreground text-background print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 text-sm">
        <Sparkles className="size-4 shrink-0" strokeWidth={2} />
        <span className="flex-1 min-w-0 truncate">
          <span className="font-semibold">Demo režim</span>
          <span className="opacity-70 mx-2 hidden sm:inline">·</span>
          <span className="opacity-90 hidden sm:inline">
            Sve što vidiš su izmišljeni podaci. Probaj klikove.
          </span>
        </span>
        <Link
          href="/signup"
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-background text-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Registruj se besplatno
          <ArrowRight className="size-3" strokeWidth={2.25} />
        </Link>
        <Link
          href="/signup"
          className="sm:hidden inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-background text-foreground text-xs font-semibold"
        >
          Registruj se
          <ArrowRight className="size-3" strokeWidth={2.25} />
        </Link>
        <Link
          href="/"
          aria-label="Zatvori demo"
          className="inline-flex items-center justify-center size-7 rounded-md bg-background/15 hover:bg-background/25 transition-colors"
        >
          <X className="size-3.5" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}
