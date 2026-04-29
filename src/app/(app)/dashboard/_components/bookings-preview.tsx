import Link from "next/link";
import { ArrowRight, Inbox, Mail, Phone } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { sr } from "date-fns/locale";
import type { RecentBooking } from "@/lib/dashboard/queries";

export function BookingsPreview({
  bookings,
}: {
  bookings: RecentBooking[];
}) {
  if (bookings.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-medium">
            Novi upiti{" "}
            <span className="text-muted-foreground">({bookings.length})</span>
          </h2>
        </div>
        <Link
          href="/profile/inbox"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          Otvori sve
          <ArrowRight className="size-3" strokeWidth={1.75} />
        </Link>
      </div>
      <ul className="divide-y divide-border">
        {bookings.map((b) => (
          <li key={b.id}>
            <Link
              href="/profile/inbox"
              className="block px-5 py-4 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <p className="text-sm font-medium truncate">
                  {b.parent_name}
                  {b.subject && (
                    <span className="text-muted-foreground font-normal">
                      {" · "}
                      {b.subject}
                    </span>
                  )}
                </p>
                <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                  {formatDistanceToNowStrict(new Date(b.created_at), {
                    locale: sr,
                    addSuffix: true,
                  })}
                </span>
              </div>
              {b.message && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {b.message}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                {b.parent_phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3" strokeWidth={1.75} />
                    {b.parent_phone}
                  </span>
                )}
                {b.parent_email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="size-3" strokeWidth={1.75} />
                    {b.parent_email}
                  </span>
                )}
                {b.student_grade && (
                  <span className="text-muted-foreground/70">
                    {b.student_grade}
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
