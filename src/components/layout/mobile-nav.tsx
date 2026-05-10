"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Menu,
  X,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
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
    items: [{ href: "/dashboard", label: "Pregled", icon: LayoutDashboard }],
  },
  {
    label: "Operacije",
    items: [
      { href: "/students", label: "Učenici", icon: Users },
      { href: "/schedule", label: "Raspored", icon: CalendarDays },
      { href: "/billing", label: "Naplata", icon: Banknote },
      { href: "/exercises", label: "Zadaci", icon: Sparkles },
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

export function MobileNav({
  badges = {},
  user,
  trial,
}: {
  badges?: { newBookings?: number };
  user?: { name: string; email: string };
  trial?: { daysLeft: number; tier: string; status: string };
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Ensure portal target exists (client-side only).
  useEffect(() => setMounted(true), []);

  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const drawer = (
    <div className="md:hidden fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={() => setOpen(false)}
      />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-sidebar border-r border-sidebar-border flex flex-col animate-in slide-in-from-left-4 duration-200">
            <div className="flex h-16 items-center justify-between px-5 border-b border-sidebar-border/60">
              <Logo href="/dashboard" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Zatvori meni"
                className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-hidden">
              {SECTIONS.map((section, idx) => (
                <div key={section.label} className={cn(idx > 0 && "mt-4")}>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground/70 px-3 mb-1.5">
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/");
                      const Icon = item.icon;
                      const badge = item.badgeKey
                        ? badges[item.badgeKey]
                        : undefined;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "relative flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-all",
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
                          <span className="flex-1 tracking-tight">
                            {item.label}
                          </span>
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
              {trial && trial.status === "trialing" && (
                <TrialWidget {...trial} onClick={() => setOpen(false)} />
              )}
              {user && (
                <ProfileWidget {...user} onClick={() => setOpen(false)} />
              )}
            </div>
          </div>
        </div>
  );

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Otvori meni"
      >
        <Menu className="size-5" strokeWidth={1.75} />
      </Button>

      {open && mounted && createPortal(drawer, document.body)}
    </>
  );
}

function TrialWidget({
  daysLeft,
  tier,
  onClick,
}: {
  daysLeft: number;
  tier: string;
  onClick?: () => void;
}) {
  const TRIAL_TOTAL = 14;
  const used = Math.max(0, TRIAL_TOTAL - daysLeft);
  const pct = Math.min(100, Math.max(0, (used / TRIAL_TOTAL) * 100));
  const urgent = daysLeft <= 3;

  return (
    <Link
      href="/settings"
      onClick={onClick}
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

function ProfileWidget({
  name,
  email,
  onClick,
}: {
  name: string;
  email: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/settings"
      onClick={onClick}
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
