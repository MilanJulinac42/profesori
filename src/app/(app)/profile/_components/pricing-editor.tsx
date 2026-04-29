"use client";

import { Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PricingPackage } from "@/lib/public-profile/types";
import { parasToRsd, parseRsdInput } from "@/lib/money";
import { cn } from "@/lib/utils";

export function PricingEditor({
  value,
  onChange,
}: {
  value: PricingPackage[];
  onChange: (next: PricingPackage[]) => void;
}) {
  function update(idx: number, patch: Partial<PricingPackage>) {
    onChange(value.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([
      ...value,
      {
        name: "",
        sessions: null,
        price: 0,
        description: "",
        highlighted: false,
      },
    ]);
  }
  function toggleHighlight(idx: number) {
    onChange(value.map((p, i) => ({ ...p, highlighted: i === idx ? !p.highlighted : p.highlighted })));
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nema dodatih paketa. Klikni "Dodaj paket" da kreneš.
        </p>
      )}

      {value.map((pkg, idx) => {
        const priceRsd = pkg.price > 0 ? String(parasToRsd(pkg.price)) : "";
        return (
          <div
            key={idx}
            className={cn(
              "rounded-lg border bg-card/50 p-3 space-y-3",
              pkg.highlighted ? "border-foreground" : "border-border",
            )}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 grid sm:grid-cols-[1fr_120px_140px] gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Naziv paketa
                  </Label>
                  <Input
                    value={pkg.name}
                    onChange={(e) => update(idx, { name: e.target.value })}
                    placeholder="npr. Mesečna karta"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Časova (opc.)
                  </Label>
                  <Input
                    type="number"
                    value={pkg.sessions ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      update(idx, {
                        sessions: v === "" ? null : Number(v),
                      });
                    }}
                    placeholder="8"
                    min={1}
                    className="h-10 text-sm tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Cena (RSD)
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={priceRsd}
                    onChange={(e) => {
                      const parsed = parseRsdInput(e.target.value);
                      update(idx, { price: parsed ?? 0 });
                    }}
                    placeholder="18000"
                    className="h-10 text-sm tabular-nums"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(idx)}
                aria-label="Ukloni"
                className="text-muted-foreground hover:text-destructive shrink-0 mt-6"
              >
                <X className="size-4" strokeWidth={1.75} />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Opis paketa (opc.)
              </Label>
              <Textarea
                rows={2}
                value={pkg.description ?? ""}
                onChange={(e) => update(idx, { description: e.target.value })}
                placeholder="npr. 8 časova mesečno, 10% popust u odnosu na pojedinačne časove."
                className="text-sm"
              />
            </div>

            <button
              type="button"
              onClick={() => toggleHighlight(idx)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                pkg.highlighted
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-secondary",
              )}
            >
              <Star
                className={cn("size-3", pkg.highlighted && "fill-current")}
                strokeWidth={1.75}
              />
              {pkg.highlighted ? "Najpopularnije" : "Označi kao najpopularnije"}
            </button>
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-3.5" strokeWidth={2} />
        Dodaj paket
      </Button>

      <input
        type="hidden"
        name="pricing_packages"
        value={JSON.stringify(value.filter((p) => p.name.trim() && p.price > 0))}
      />
    </div>
  );
}
