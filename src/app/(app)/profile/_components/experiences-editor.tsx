"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Experience } from "@/lib/public-profile/types";

export function ExperiencesEditor({
  value,
  onChange,
}: {
  value: Experience[];
  onChange: (next: Experience[]) => void;
}) {
  function update(idx: number, patch: Partial<Experience>) {
    onChange(value.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([
      ...value,
      { title: "", organization: "", period: "", description: "" },
    ]);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">Nema dodatog iskustva.</p>
      )}

      {value.map((exp, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-border bg-card/50 p-3 space-y-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Pozicija
                </Label>
                <Input
                  value={exp.title}
                  onChange={(e) => update(idx, { title: e.target.value })}
                  placeholder="npr. Profesor matematike"
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Organizacija
                </Label>
                <Input
                  value={exp.organization}
                  onChange={(e) =>
                    update(idx, { organization: e.target.value })
                  }
                  placeholder="npr. OŠ Vuk Karadžić, Beograd"
                  className="h-10 text-sm"
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

          <div className="grid sm:grid-cols-[200px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Period</Label>
              <Input
                value={exp.period ?? ""}
                onChange={(e) => update(idx, { period: e.target.value })}
                placeholder="2019 — sada"
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Opis (opciono)
              </Label>
              <Textarea
                rows={2}
                value={exp.description ?? ""}
                onChange={(e) =>
                  update(idx, { description: e.target.value })
                }
                placeholder="Kratak opis posla..."
                className="text-sm"
              />
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-3.5" strokeWidth={2} />
        Dodaj iskustvo
      </Button>

      <input
        type="hidden"
        name="experiences"
        value={JSON.stringify(
          value.filter((e) => e.title.trim() || e.organization.trim()),
        )}
      />
    </div>
  );
}
