"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SECTION_META,
  type Section,
  type SectionType,
} from "@/lib/public-profile/sections";
import { cn } from "@/lib/utils";

export function SectionsEditor({
  value,
  onChange,
}: {
  value: Section[];
  onChange: (next: Section[]) => void;
}) {
  function move(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= value.length) return;
    const list = [...value];
    [list[idx], list[next]] = [list[next], list[idx]];
    onChange(list);
  }

  function toggleVisible(idx: number) {
    onChange(
      value.map((s, i) => (i === idx ? { ...s, visible: !s.visible } : s)),
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/40 flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground flex-1">
            Hero · uvek prikazano
          </span>
        </div>
        {value.map((s, idx) => {
          const meta = SECTION_META[s.type];
          return (
            <div
              key={s.type}
              className={cn(
                "px-4 py-3 flex items-center gap-3",
                !s.visible && "opacity-50",
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{meta.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {meta.description}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  aria-label="Pomeri gore"
                  className="text-muted-foreground"
                >
                  <ArrowUp className="size-4" strokeWidth={1.75} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => move(idx, 1)}
                  disabled={idx === value.length - 1}
                  aria-label="Pomeri dole"
                  className="text-muted-foreground"
                >
                  <ArrowDown className="size-4" strokeWidth={1.75} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => toggleVisible(idx)}
                  aria-label={s.visible ? "Sakrij" : "Prikaži"}
                  title={s.visible ? "Vidljivo" : "Sakriveno"}
                  className={cn(
                    "ml-1",
                    s.visible
                      ? "text-foreground"
                      : "text-muted-foreground/50",
                  )}
                >
                  {s.visible ? (
                    <Eye className="size-4" strokeWidth={1.75} />
                  ) : (
                    <EyeOff className="size-4" strokeWidth={1.75} />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
        <div className="px-4 py-2.5 bg-secondary/40 flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground flex-1">
            Booking · uvek prikazano
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Strelicama menjaš redosled. Ikonica oka sakriva ili prikazuje sekciju.
        Sekcije bez podataka se automatski sakrivaju.
      </p>

      <input type="hidden" name="sections" value={JSON.stringify(value)} />
    </div>
  );
}

export type { Section, SectionType };
