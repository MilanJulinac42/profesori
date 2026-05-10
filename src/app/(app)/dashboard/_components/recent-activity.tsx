import Link from "next/link";
import {
  Activity,
  Banknote,
  BellRing,
  Check,
  Inbox,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { srLatn } from "date-fns/locale";
import { EmptyState } from "@/components/empty-state";
import { formatRsd } from "@/lib/money";
import type {
  ActivityEvent,
  ActivityType,
} from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";

const ICONS: Record<ActivityType, LucideIcon> = {
  student_added: UserPlus,
  lesson_held: Check,
  lesson_cancelled: X,
  payment_recorded: Banknote,
  booking_received: Inbox,
  reminder_sent: BellRing,
};

const TONES: Record<ActivityType, string> = {
  student_added: "text-foreground bg-secondary",
  lesson_held: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
  lesson_cancelled: "text-muted-foreground bg-secondary",
  payment_recorded: "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
  booking_received: "text-foreground bg-foreground/10",
  reminder_sent: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30",
};

type Group = {
  key: string;
  type: ActivityType;
  title: string;
  detail?: string;
  href?: string;
  count: number;
  latest: ActivityEvent;
  totalAmount?: number;
};

function groupConsecutive(events: ActivityEvent[]): Group[] {
  const groups: Group[] = [];
  for (const e of events) {
    const dayKey = new Date(e.timestamp).toISOString().slice(0, 10);
    const last = groups[groups.length - 1];
    if (
      last &&
      last.type === e.type &&
      last.title === e.title &&
      last.detail === e.detail &&
      new Date(last.latest.timestamp).toISOString().slice(0, 10) === dayKey
    ) {
      last.count += 1;
      if (e.amount !== undefined) {
        last.totalAmount = (last.totalAmount ?? 0) + e.amount;
      }
    } else {
      groups.push({
        key: e.id,
        type: e.type,
        title: e.title,
        detail: e.detail,
        href: e.href,
        count: 1,
        latest: e,
        totalAmount: e.amount,
      });
    }
  }
  return groups;
}

export function RecentActivity({ events }: { events: ActivityEvent[] }) {
  const groups = groupConsecutive(events);

  return (
    <section className="card-elevated card-glow rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg tile-cyan shrink-0">
            <Activity className="size-3.5" strokeWidth={2} />
          </div>
          <h2 className="font-display text-lg text-foreground">
            Skorija aktivnost
          </h2>
        </div>
      </div>
      {groups.length === 0 ? (
        <div className="py-6">
          <EmptyState
            icon={Activity}
            tile="cyan"
            size="compact"
            title="Još nema aktivnosti"
            description="Dodaj učenika ili zakaži čas da vidiš istoriju."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {groups.map((g) => {
            const Icon = ICONS[g.type];
            const tone = TONES[g.type];
            const time = formatDistanceToNowStrict(
              new Date(g.latest.timestamp),
              { locale: srLatn, addSuffix: true },
            );
            const inner = (
              <>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    tone,
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    {g.count > 1 && (
                      <span className="text-muted-foreground tabular-nums">
                        {g.count}×{" "}
                      </span>
                    )}
                    <span className="font-medium">{g.title}</span>
                    {g.detail && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {g.detail}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums shrink-0 text-right">
                  {g.totalAmount !== undefined && (
                    <span className="block">{formatRsd(g.totalAmount)}</span>
                  )}
                  <span className="block">{time}</span>
                </div>
              </>
            );
            return (
              <li key={g.key} className="px-5 py-2.5">
                {g.href ? (
                  <Link
                    href={g.href}
                    className="flex items-center gap-3 group"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
