"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Qualification } from "@/lib/public-profile/types";

export function QualificationsEditor({
  value,
  onChange,
}: {
  value: Qualification[];
  onChange: (next: Qualification[]) => void;
}) {
  function update(idx: number, patch: Partial<Qualification>) {
    onChange(value.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...value, { title: "", institution: "", year: "" }]);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nema dodatih kvalifikacija.
        </p>
      )}

      {value.map((q, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-border bg-card/50 p-3 space-y-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Diploma / kvalifikacija
                </Label>
                <Input
                  value={q.title}
                  onChange={(e) => update(idx, { title: e.target.value })}
                  placeholder="npr. Master profesor matematike"
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Institucija
                </Label>
                <Input
                  value={q.institution}
                  onChange={(e) =>
                    update(idx, { institution: e.target.value })
                  }
                  placeholder="npr. Matematički fakultet, Beograd"
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
          <div className="space-y-1.5 max-w-[200px]">
            <Label className="text-xs text-muted-foreground">Godina</Label>
            <Input
              value={q.year ?? ""}
              onChange={(e) => update(idx, { year: e.target.value })}
              placeholder="2018"
              className="h-10 text-sm"
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-3.5" strokeWidth={2} />
        Dodaj kvalifikaciju
      </Button>

      <input
        type="hidden"
        name="qualifications"
        value={JSON.stringify(
          value.filter((q) => q.title.trim() || q.institution.trim()),
        )}
      />
    </div>
  );
}
