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
import { sr } from "date-fns/locale";
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

export function RecentActivity({ events }: { events: ActivityEvent[] }) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-medium">Skorija aktivnost</h2>
        </div>
      </div>
      {events.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Još nema aktivnosti. Dodaj učenika ili zakaži čas da vidiš
            istoriju.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {events.map((e) => {
            const Icon = ICONS[e.type];
            const tone = TONES[e.type];
            const inner = (
              <>
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    tone,
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{e.title}</span>
                    {e.detail && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {e.detail}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                    {formatDistanceToNowStrict(new Date(e.timestamp), {
                      locale: sr,
                      addSuffix: true,
                    })}
                    {e.amount !== undefined && (
                      <>
                        <span className="mx-1.5 text-muted-foreground/50">·</span>
                        {formatRsd(e.amount)}
                      </>
                    )}
                  </p>
                </div>
              </>
            );
            return (
              <li key={e.id} className="px-5 py-3">
                {e.href ? (
                  <Link
                    href={e.href}
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
