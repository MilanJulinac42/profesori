"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Banknote,
  Sparkles,
  Globe,
  Inbox,
  Settings,
  MessageCircle,
  Bot,
  ArrowUpRight,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "./logo";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "newBookings";
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    label: "Pregled",
    items: [
      { href: "/dashboard", label: "Pregled", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operacije",
    items: [
      { href: "/students", label: "Učenici", icon: Users },
      { href: "/schedule", label: "Raspored", icon: CalendarDays },
      { href: "/billing", label: "Naplata", icon: Banknote },
      { href: "/exercises", label: "Zadaci", icon: Sparkles },
      { href: "/curricula", label: "Kurikulumi", icon: Compass },
    ],
  },
  {
    label: "Komunikacija",
    items: [
      { href: "/poruke", label: "Poruke", icon: MessageCircle },
      { href: "/asistent", label: "Asistent", icon: Bot },
      {
        href: "/profile/inbox",
        label: "Upiti",
        icon: Inbox,
        badgeKey: "newBookings",
      },
    ],
  },
  {
    label: "Nalog",
    items: [
      { href: "/profile", label: "Javni profil", icon: Globe },
      { href: "/settings", label: "Podešavanja", icon: Settings },
    ],
  },
];

function tourKeyFor(href: string): string | undefined {
  if (href.startsWith("/students")) return "nav-students";
  if (href.startsWith("/schedule")) return "nav-schedule";
  if (href.startsWith("/exercises")) return "nav-exercises";
  if (href.startsWith("/billing")) return "nav-billing";
  return undefined;
}

/**
 * Returns the href of the nav item that "wins" for the current pathname.
 * Longest matching href wins — so `/profile/inbox` lights up Upiti,
 * not Javni profil (whose href is the shorter `/profile`).
 */
function pickActiveHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    if (pathname === href || pathname.startsWith(href + "/")) {
      if (!best || href.length > best.length) best = href;
    }
  }
  return best;
}

export function Sidebar({
  badges = {},
  user,
  trial,
}: {
  badges?: { newBookings?: number };
  user?: { name: string; email: string };
  trial?: { daysLeft: number; tier: string; status: string };
}) {
  const pathname = usePathname();
  const allHrefs = SECTIONS.flatMap((s) => s.items.map((i) => i.href));
  const activeHref = pickActiveHref(pathname, allHrefs);

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground print:hidden sticky top-0 self-start h-screen">
      <div className="flex h-16 items-center px-5 border-b border-sidebar-border/60">
        <Logo href="/dashboard" />
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-hidden">
        {SECTIONS.map((section, idx) => (
          <div
            key={section.label}
            className={cn(idx > 0 && "mt-4")}
          >
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground/70 px-3 mb-1.5">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = activeHref === item.href;
                const Icon = item.icon;
                const badge = item.badgeKey
                  ? badges[item.badgeKey]
                  : undefined;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-tour={tourKeyFor(item.href)}
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg px-3 py-1.5 text-[14px] transition-all",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-brand"
                      />
                    )}
                    <Icon
                      className={cn(
                        "size-[17px] shrink-0 transition-colors",
                        active && "text-brand",
                      )}
                      strokeWidth={active ? 2.25 : 1.75}
                    />
                    <span className="flex-1 tracking-tight">{item.label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-brand text-brand-foreground text-[10px] font-bold px-1.5 shadow-[0_2px_8px_-2px_oklch(0.78_0.16_205/0.5)]">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border/60 space-y-2.5">
        {trial && trial.status === "trialing" && <TrialWidget {...trial} />}
        {user && <ProfileWidget {...user} />}
      </div>
    </aside>
  );
}

function TrialWidget({
  daysLeft,
  tier,
}: {
  daysLeft: number;
  tier: string;
}) {
  const TRIAL_TOTAL = 14;
  const used = Math.max(0, TRIAL_TOTAL - daysLeft);
  const pct = Math.min(100, Math.max(0, (used / TRIAL_TOTAL) * 100));
  const urgent = daysLeft <= 3;

  return (
    <Link
      href="/settings"
      className="group block rounded-xl border border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent/60 px-3 py-2.5 transition-colors"
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
          Probni period
        </p>
        <ArrowUpRight
          className="size-3 text-muted-foreground/50 group-hover:text-foreground transition-colors"
          strokeWidth={2}
        />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-[18px] font-semibold tabular-nums leading-none",
            urgent ? "text-amber-400" : "text-sidebar-foreground",
          )}
        >
          {daysLeft}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {daysLeft === 1 ? "dan ostao" : "dana ostalo"}
        </span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            urgent ? "bg-amber-400" : "bg-brand",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        plan{" "}
        <span className="text-sidebar-foreground/90 font-medium">{tier}</span>
        {" · "}
        <span className="text-brand font-semibold">Nadogradi</span>
      </p>
    </Link>
  );
}

function ProfileWidget({ name, email }: { name: string; email: string }) {
  return (
    <Link
      href="/settings"
      className="group flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sidebar-accent/40 transition-colors"
    >
      <Avatar name={name} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-sidebar-foreground truncate">
          {name}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">{email}</p>
      </div>
      <Settings
        className="size-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors"
        strokeWidth={1.75}
      />
    </Link>
  );
}
