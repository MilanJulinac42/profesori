"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Check,
  MessageSquare,
  ClipboardCheck,
  FileText,
  Inbox,
} from "lucide-react";
import {
  markNotificationsSeen,
  type NotificationItem,
} from "@/lib/notifications";

const KIND_ICON: Record<
  NotificationItem["kind"],
  typeof Bell
> = {
  booking_received: MessageSquare,
  homework_submitted: ClipboardCheck,
  report_sent: FileText,
};

const KIND_TILE: Record<NotificationItem["kind"], string> = {
  booking_received: "tile-cyan",
  homework_submitted: "tile-emerald",
  report_sent: "tile-violet",
};

export function NotificationsBell({
  initialItems,
  initialUnreadCount,
}: {
  initialItems: NotificationItem[];
  initialUnreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [unread, setUnread] = useState(initialUnreadCount);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // When opened, mark items seen and reset badge optimistically.
  function openAndMark() {
    setOpen(true);
    if (unread === 0) return;
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, unread: false })));
    startTransition(async () => {
      await markNotificationsSeen();
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openAndMark())}
        aria-label={`Notifikacije${unread > 0 ? ` (${unread} novih)` : ""}`}
        aria-expanded={open}
        className="relative inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Bell className="size-4" strokeWidth={1.75} />
        {unread > 0 && (
          <>
            <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-brand text-brand-foreground text-[9px] font-bold px-1 shadow-[0_2px_8px_-2px_oklch(0.78_0.16_205/0.5)] tabular-nums">
              {unread > 9 ? "9+" : unread}
            </span>
            <span
              aria-hidden
              className="absolute top-0.5 right-0.5 size-2 rounded-full bg-brand pulse-dot"
            />
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-card shadow-2xl overflow-hidden z-40 animate-palette-pop origin-top-right">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-medium">Notifikacije</p>
            {unread > 0 && (
              <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-brand">
                {unread} novih
              </span>
            )}
          </div>

          <ul className="max-h-[60vh] overflow-y-auto divide-y divide-border">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nema nedavnih događaja.
              </li>
            ) : (
              items.map((item) => {
                const Icon = KIND_ICON[item.kind];
                const tile = KIND_TILE[item.kind];
                const dt = new Date(item.createdAt);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors"
                    >
                      <span
                        className={`flex size-9 items-center justify-center rounded-lg ${tile} shrink-0 mt-0.5`}
                      >
                        <Icon className="size-4" strokeWidth={2} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                            {dt.toLocaleDateString("sr-Latn-RS", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>
                        <span className="block text-xs text-muted-foreground truncate mt-0.5">
                          {item.detail}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>

          <div className="px-3 py-2 border-t border-border flex items-center justify-between text-xs">
            <Link
              href="/profile/inbox"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Inbox className="size-3" strokeWidth={2} />
              Otvori sve upite
            </Link>
            {unread === 0 && items.length > 0 && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Check className="size-3" strokeWidth={2} />
                Sve pročitano
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
