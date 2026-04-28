"use client";

import { useState } from "react";
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
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
            <div className="flex h-14 items-center justify-between px-5">
              <Logo />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Zatvori meni"
              >
                <X className="size-5" strokeWidth={1.75} />
              </Button>
            </div>
            <nav className="flex-1 px-3 py-1 space-y-px overflow-y-auto">
              {NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60",
                    )}
                  >
                    <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
