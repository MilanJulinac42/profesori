"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  Users,
  CalendarDays,
  CalendarCheck,
  ArrowRight,
  Check,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dismissDashboardSetupAction } from "@/lib/onboarding/dashboard-setup";

type Tile = "cyan" | "violet" | "emerald";

type Step = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tile: Tile;
  done: boolean;
};

export function NextStepsCard({
  hasStudents,
  hasLessons,
  googleConnected,
}: {
  hasStudents: boolean;
  hasLessons: boolean;
  googleConnected: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleDismiss() {
    startTransition(async () => {
      await dismissDashboardSetupAction();
    });
  }

  const steps: Step[] = [
    {
      href: "/students/new",
      title: "Dodaj prvog učenika",
      description: "Ime, razred i kontakt roditelja.",
      icon: Users,
      tile: "cyan",
      done: hasStudents,
    },
    {
      href: "/schedule",
      title: "Zakaži prvi čas",
      description: "Pojedinačni termin ili ponavljajući slot.",
      icon: CalendarDays,
      tile: "violet",
      done: hasLessons,
    },
    {
      href: "/settings",
      title: "Poveži Google kalendar",
      description: "Časovi se automatski sinhronizuju sa tvojim kalendarom.",
      icon: CalendarCheck,
      tile: "emerald",
      done: googleConnected,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div
      className={cn(
        "card-elevated card-glow rounded-2xl overflow-hidden transition-opacity",
        pending && "opacity-60 pointer-events-none",
      )}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
            Postavi platformu
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {doneCount} od {steps.length} završeno
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 w-6 rounded-full transition-colors",
                  i < doneCount ? "bg-brand" : "bg-secondary",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-50"
            aria-label="Sakrij vodič za podešavanje"
          >
            <X className="size-3" strokeWidth={2.25} />
            Sakrij
          </button>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <li key={step.href}>
              <Link
                href={step.href}
                className={cn(
                  "group flex items-center gap-4 px-5 py-4 transition-colors",
                  step.done
                    ? "opacity-60 hover:opacity-100"
                    : "hover:bg-secondary/40",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl shrink-0",
                    step.done ? "tile-emerald" : `tile-${step.tile}`,
                  )}
                >
                  {step.done ? (
                    <Check className="size-4" strokeWidth={2.5} />
                  ) : (
                    <Icon className="size-4" strokeWidth={2} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold text-foreground tracking-tight",
                      step.done && "line-through decoration-muted-foreground/40",
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {step.done ? "Završeno ✓" : step.description}
                  </p>
                </div>
                <ArrowRight
                  className="size-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
                  strokeWidth={2}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
