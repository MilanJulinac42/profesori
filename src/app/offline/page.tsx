import Link from "next/link";
import { WifiOff, RotateCcw } from "lucide-react";

/**
 * Offline fallback served by the service worker when a navigation request
 * fails (no network). Static, no data fetches.
 */
export const dynamic = "force-static";

export const metadata = {
  title: "Bez veze — Profesori",
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-background text-foreground">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl tile-amber mx-auto">
          <WifiOff className="size-6" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
            Bez veze
          </p>
          <h1 className="font-display text-2xl text-foreground mt-2">
            Trenutno si offline.
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Profesori treba internet konekciju za rad. Probaj kad vratiš mrežu.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all"
          >
            <RotateCcw className="size-3.5" strokeWidth={2} />
            Pokušaj ponovo
          </Link>
        </div>
      </div>
    </main>
  );
}
