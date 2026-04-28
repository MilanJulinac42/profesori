"use client";

import { Star } from "lucide-react";
import { LESSON_RATING_LABELS } from "@/lib/lessons/types";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value !== null && n <= value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(value === n ? null : n)}
              className="size-7 flex items-center justify-center rounded-md hover:bg-secondary transition-colors"
              aria-label={`${n} od 5`}
            >
              <Star
                className={cn(
                  "size-4 transition-colors",
                  active
                    ? "fill-foreground text-foreground"
                    : "text-muted-foreground/40",
                )}
                strokeWidth={1.75}
              />
            </button>
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground">
        {value !== null ? LESSON_RATING_LABELS[value] : "Nije ocenjeno"}
      </span>
    </div>
  );
}
