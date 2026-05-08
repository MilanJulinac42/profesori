import {
  StickyNote,
  Mic,
  Sparkles,
  Mail,
  ClipboardList,
  Check,
  Clock,
} from "lucide-react";
import type { AppValueStats } from "@/lib/dashboard/app-value";

type Props = {
  stats: AppValueStats;
};

export function AppValueWidget({ stats }: Props) {
  const hasAnything =
    stats.lessonsWithNotes +
      stats.voiceTranscriptions +
      stats.exerciseSetsGenerated +
      stats.reportsSent +
      stats.homeworkAssigned +
      stats.homeworkSubmitted >
    0;

  // Empty state — uvek se renderuje (anchor za onboarding tour, daje
  // korisniku pojam šta će ovde videti kad bude radio).
  if (!hasAnything) {
    return (
      <section
        data-tour="app-value"
        className="rounded-xl border border-dashed border-border bg-secondary/20 p-5"
      >
        <div className="flex items-start gap-3">
          <Clock
            className="size-5 text-muted-foreground mt-0.5 shrink-0"
            strokeWidth={1.75}
          />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Šta je app uradio za tebe
            </p>
            <p className="text-sm mt-1.5">
              Tek si počeo. Posle prvih nekoliko časova, beleški i izveštaja
              ovde ćeš videti koliko ti vremena app štedi nedeljno.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const hours = Math.floor(stats.totalMinutesSaved / 60);
  const minutes = stats.totalMinutesSaved % 60;
  const timeLabel =
    hours > 0
      ? `~${hours}h${minutes > 0 ? ` ${minutes}min` : ""}`
      : `~${minutes} min`;

  const items: { icon: typeof StickyNote; label: string; count: number }[] = [
    { icon: StickyNote, label: "beleški sa časova", count: stats.lessonsWithNotes },
    { icon: Mic, label: "glasovnih transkripcija", count: stats.voiceTranscriptions },
    {
      icon: Sparkles,
      label: "AI seta zadataka",
      count: stats.exerciseSetsGenerated,
    },
    { icon: Mail, label: "izveštaja poslato", count: stats.reportsSent },
    {
      icon: ClipboardList,
      label: "domaćih zadato",
      count: stats.homeworkAssigned,
    },
    {
      icon: Check,
      label: "domaćih predato/ocenjeno",
      count: stats.homeworkSubmitted,
    },
  ].filter((i) => i.count > 0);

  return (
    <section
      data-tour="app-value"
      className="rounded-xl border border-border bg-gradient-to-br from-secondary/50 to-card p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Šta je app uradio za tebe
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Poslednjih {stats.periodDays} dana
          </p>
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <Clock className="size-4" strokeWidth={1.75} />
          <span className="text-2xl font-medium tracking-tight tabular-nums">
            {timeLabel}
          </span>
          <span className="text-xs text-muted-foreground">ušteđeno</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex items-center gap-2.5 rounded-md bg-background/60 border border-border/50 p-3"
          >
            <it.icon
              className="size-4 text-muted-foreground shrink-0"
              strokeWidth={1.75}
            />
            <div className="min-w-0">
              <div className="text-lg font-medium tabular-nums leading-none">
                {it.count}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 truncate">
                {it.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground mt-3 italic">
        Procena vremena bazirana na konzervativnim heuristikama (5 min po
        belešci, 15 min po izveštaju, 30 min po setu zadataka itd.).
      </p>
    </section>
  );
}
