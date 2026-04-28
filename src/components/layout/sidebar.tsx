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
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Pregled", icon: LayoutDashboard },
  { href: "/students", label: "Učenici", icon: Users },
  { href: "/schedule", label: "Raspored", icon: CalendarDays },
  { href: "/billing", label: "Naplata", icon: Banknote },
  { href: "/exercises", label: "Zadaci", icon: Sparkles },
  { href: "/profile", label: "Javni profil", icon: Globe },
  { href: "/settings", label: "Podešavanja", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center px-5">
        <Logo />
      </div>

      <nav className="flex-1 px-3 py-1 space-y-px">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-2.5">
          Probni period
        </p>
      </div>
    </aside>
  );
}
