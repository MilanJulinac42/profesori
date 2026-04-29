"use client";

import { Check } from "lucide-react";
import { THEMES, THEME_OPTIONS, type ThemeId } from "@/lib/public-profile/themes";
import { cn } from "@/lib/utils";

export function ThemePicker({
  value,
  onChange,
}: {
  value: ThemeId;
  onChange: (next: ThemeId) => void;
}) {
  return (
    <div className="space-y-2">
      <input type="hidden" name="theme" value={value} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {THEME_OPTIONS.map((id) => {
          const t = THEMES[id];
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "group relative overflow-hidden rounded-xl border p-3 text-left transition-all",
                active
                  ? "border-foreground ring-2 ring-foreground/20"
                  : "border-border hover:border-foreground/30",
              )}
            >
              <div
                className={cn(
                  "h-20 w-full rounded-lg mb-3 relative overflow-hidden",
                  t.id === "minimal" && "bg-secondary",
                  t.id === "editorial" && "bg-secondary",
                )}
                style={
                  t.id !== "minimal" && t.id !== "editorial"
                    ? { backgroundImage: t.previewBg }
                    : undefined
                }
              >
                {t.id === "minimal" && (
                  <div
                    className="absolute inset-0 opacity-50"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                      backgroundSize: "16px 16px",
                    }}
                  />
                )}
                {t.id === "editorial" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-xl font-medium tracking-tight text-foreground/80"
                      style={{ fontFamily: "var(--font-instrument-serif), serif" }}
                    >
                      Aa
                    </span>
                  </div>
                )}
                {active && (
                  <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                    <Check className="size-3" strokeWidth={2.5} />
                  </span>
                )}
              </div>
              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {t.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
