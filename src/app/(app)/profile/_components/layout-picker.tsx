"use client";

import { Check, Lock } from "lucide-react";
import {
  LAYOUTS,
  LAYOUT_OPTIONS,
  type LayoutId,
} from "@/lib/public-profile/layouts";
import { cn } from "@/lib/utils";

export function LayoutPicker({
  value,
  onChange,
}: {
  value: LayoutId;
  onChange: (next: LayoutId) => void;
}) {
  return (
    <div className="space-y-2">
      <input type="hidden" name="layout" value={value} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {LAYOUT_OPTIONS.map((id) => {
          const l = LAYOUTS[id];
          const active = value === id;
          const disabled = !l.available;
          return (
            <button
              key={id}
              type="button"
              onClick={() => !disabled && onChange(id)}
              disabled={disabled}
              className={cn(
                "group relative overflow-hidden rounded-xl border p-3 text-left transition-all",
                active
                  ? "border-foreground ring-2 ring-foreground/20"
                  : "border-border hover:border-foreground/30",
                disabled && "opacity-60 cursor-not-allowed",
              )}
            >
              <div className="aspect-[5/3] w-full rounded-lg bg-secondary mb-3 relative overflow-hidden flex items-center justify-center p-2">
                <LayoutWireframe id={id} />
                {active && !disabled && (
                  <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                    <Check className="size-3" strokeWidth={2.5} />
                  </span>
                )}
                {disabled && (
                  <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-muted-foreground/30 text-muted-foreground">
                    <Lock className="size-3" strokeWidth={2} />
                  </span>
                )}
              </div>
              <p className="text-sm font-medium">{l.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {disabled ? "Uskoro" : l.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Tiny wireframe SVGs that show the structure of each layout. */
function LayoutWireframe({ id }: { id: LayoutId }) {
  const stroke = "var(--border)";
  const fill = "var(--card)";
  const accent = "var(--foreground)";

  if (id === "stack") {
    return (
      <svg viewBox="0 0 100 60" className="w-full h-full">
        <rect x="2" y="2" width="96" height="6" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
        <rect x="2" y="11" width="96" height="14" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
        <circle cx="14" cy="18" r="4" fill={accent} opacity="0.6" />
        <rect x="22" y="15" width="40" height="2" fill={accent} opacity="0.6" rx="0.5" />
        <rect x="22" y="19" width="28" height="1.5" fill={accent} opacity="0.3" rx="0.5" />
        <rect x="2" y="28" width="96" height="6" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
        <rect x="2" y="37" width="96" height="6" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
        <rect x="2" y="46" width="96" height="6" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
      </svg>
    );
  }

  if (id === "split") {
    return (
      <svg viewBox="0 0 100 60" className="w-full h-full">
        <rect x="2" y="2" width="96" height="6" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
        {/* Sidebar */}
        <rect x="2" y="11" width="34" height="46" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
        <circle cx="19" cy="22" r="5" fill={accent} opacity="0.6" />
        <rect x="6" y="30" width="26" height="2" fill={accent} opacity="0.6" rx="0.5" />
        <rect x="6" y="34" width="20" height="1.5" fill={accent} opacity="0.3" rx="0.5" />
        <rect x="6" y="40" width="26" height="3" fill={accent} opacity="0.4" rx="1" />
        <rect x="6" y="46" width="14" height="2" fill={accent} opacity="0.5" rx="1" />
        {/* Right column */}
        <rect x="38" y="11" width="60" height="6" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
        <rect x="38" y="20" width="60" height="10" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
        <rect x="38" y="33" width="60" height="6" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
        <rect x="38" y="42" width="60" height="6" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
        <rect x="38" y="51" width="60" height="6" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
      </svg>
    );
  }

  if (id === "magazine") {
    return (
      <svg viewBox="0 0 100 60" className="w-full h-full">
        <rect x="2" y="2" width="96" height="6" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
        <rect x="20" y="13" width="60" height="3" fill={accent} opacity="0.7" rx="0.5" />
        <rect x="30" y="19" width="40" height="1.5" fill={accent} opacity="0.3" rx="0.5" />
        <circle cx="14" cy="14" r="2.5" fill={accent} opacity="0.6" />
        <rect x="14" y="26" width="40" height="32" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
        <rect x="56" y="26" width="30" height="20" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
        <rect x="56" y="48" width="30" height="10" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
      </svg>
    );
  }

  // card
  return (
    <svg viewBox="0 0 100 60" className="w-full h-full">
      <rect x="2" y="2" width="96" height="6" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
      <rect x="14" y="14" width="72" height="42" fill={fill} stroke={stroke} strokeWidth="0.5" rx="2" />
      <circle cx="50" cy="22" r="4" fill={accent} opacity="0.6" />
      <rect x="30" y="30" width="40" height="2" fill={accent} opacity="0.6" rx="0.5" />
      <rect x="22" y="38" width="56" height="6" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
      <rect x="22" y="46" width="56" height="6" fill={fill} stroke={stroke} strokeWidth="0.5" rx="1" />
    </svg>
  );
}
