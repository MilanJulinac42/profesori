import {
  StickyNote,
  Mic,
  Sparkles,
  Mail,
  ClipboardList,
  Check,
  Clock,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
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

  if (!hasAnything) {
    return (
      <section
        data-tour="app-value"
        className="card-elevated card-glow rounded-2xl py-6"
      >
        <EmptyState
          icon={Clock}
          tile="violet"
          title="Šta je app uradio za tebe"
          description="Posle prvih nekoliko časova ovde ćeš videti koliko ti vremena app štedi nedeljno."
        />
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
    { icon: StickyNote, label: "beleški", count: stats.lessonsWithNotes },
    { icon: Mic, label: "transkripcija", count: stats.voiceTranscriptions },
    { icon: Sparkles, label: "AI setova", count: stats.exerciseSetsGenerated },
    { icon: Mail, label: "izveštaja", count: stats.reportsSent },
    { icon: ClipboardList, label: "domaćih", count: stats.homeworkAssigned },
    {
      icon: Check,
      label: "ocenjeno",
      count: stats.homeworkSubmitted,
    },
  ].filter((i) => i.count > 0);

  return (
    <section
      data-tour="app-value"
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">App ti štedi vreme</h2>
          <p className="text-[11px] text-muted-foreground">
            Poslednjih {stats.periodDays} dana
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Clock className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
          <span className="text-base font-medium tabular-nums">
            {timeLabel}
          </span>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {items.map((it) => (
          <li
            key={it.label}
            className="px-4 py-2 flex items-center gap-2.5 text-xs"
          >
            <it.icon
              className="size-3.5 text-muted-foreground shrink-0"
              strokeWidth={1.75}
            />
            <span className="flex-1 text-muted-foreground capitalize">
              {it.label}
            </span>
            <span className="font-medium tabular-nums">{it.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
