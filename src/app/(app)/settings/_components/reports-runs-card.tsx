"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  Server,
  UserRound,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runReportsManually, type CronRunLog } from "@/lib/reports/runs";
import type { ReportKind } from "@/lib/reports/types";

const KIND_LABEL: Record<ReportKind, string> = {
  weekly: "Nedeljni",
  monthly: "Mesečni",
};

const STATUS_TONE: Record<CronRunLog["status"], string> = {
  running: "text-muted-foreground",
  ok: "text-emerald-500 dark:text-emerald-400",
  partial: "text-amber-500 dark:text-amber-400",
  failed: "text-destructive",
};

const STATUS_LABEL: Record<CronRunLog["status"], string> = {
  running: "u toku",
  ok: "uspeh",
  partial: "delimično",
  failed: "neuspeh",
};

export function ReportsRunsCard({ initial }: { initial: CronRunLog[] }) {
  const [pendingKind, setPendingKind] = useState<ReportKind | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function runNow(kind: ReportKind) {
    if (pendingKind) return;
    setPendingKind(kind);
    startTransition(async () => {
      const res = await runReportsManually({ kind });
      setPendingKind(null);
      if (!res.ok) {
        toast.error("Slanje izveštaja", { description: res.error });
        return;
      }
      if (res.sent === 0 && res.skippedAlreadySent === 0) {
        toast.message("Nije bilo izveštaja za slanje", {
          description: `Ni jedan učenik nema uključen ${KIND_LABEL[kind].toLowerCase()} izveštaj za prethodni period.`,
        });
      } else {
        toast.success(
          `Poslato ${res.sent} izveštaja (${KIND_LABEL[kind].toLowerCase()})`,
          {
            description:
              res.failed > 0
                ? `${res.failed} neuspešno, ${res.skippedAlreadySent} već poslato`
                : res.skippedAlreadySent > 0
                  ? `${res.skippedAlreadySent} već poslato (preskočeno)`
                  : undefined,
          },
        );
      }
      router.refresh();
    });
  }

  return (
    <section className="card-elevated card-glow rounded-2xl p-5 space-y-4">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl tile-violet shrink-0">
            <CalendarClock className="size-5" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Automatski izveštaji
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Nedeljni izveštaj se šalje ponedeljkom u 7:00, mesečni 1.
              u mesecu u 7:00. Možeš ručno pokrenuti slanje za prethodni
              period.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => runNow("weekly")}
            disabled={pendingKind !== null}
          >
            {pendingKind === "weekly" ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Send className="size-3.5" strokeWidth={2} />
            )}
            Pošalji nedeljni
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => runNow("monthly")}
            disabled={pendingKind !== null}
          >
            {pendingKind === "monthly" ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Send className="size-3.5" strokeWidth={2} />
            )}
            Pošalji mesečni
          </Button>
        </div>
      </header>

      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground mb-2">
          Poslednje pokretanje
        </p>
        {initial.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            Još nije bilo pokretanja.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {initial.map((r) => (
              <li
                key={r.id}
                className="px-3 py-2.5 flex items-center gap-3 text-xs"
              >
                <span
                  aria-hidden
                  className="flex size-6 items-center justify-center rounded-md bg-secondary shrink-0"
                  title={r.source === "cron" ? "Automatski" : "Ručno"}
                >
                  {r.source === "cron" ? (
                    <Server className="size-3" strokeWidth={2} />
                  ) : (
                    <UserRound className="size-3" strokeWidth={2} />
                  )}
                </span>
                <span className="font-medium">{KIND_LABEL[r.kind]}</span>
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <Clock className="size-3" strokeWidth={1.75} />
                  {new Date(r.started_at).toLocaleString("sr-Latn-RS", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="flex-1" />
                {r.stats && (
                  <span className="text-muted-foreground tabular-nums hidden sm:inline">
                    {r.stats.sent ?? 0}/{r.stats.students_total ?? 0} poslato
                    {r.stats.failed ? `, ${r.stats.failed} greška` : ""}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 font-medium ${STATUS_TONE[r.status]}`}
                >
                  {r.status === "ok" ? (
                    <CheckCircle2 className="size-3" strokeWidth={2} />
                  ) : r.status === "running" ? (
                    <Loader2 className="size-3 animate-spin" strokeWidth={2} />
                  ) : (
                    <AlertTriangle className="size-3" strokeWidth={2} />
                  )}
                  {STATUS_LABEL[r.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
