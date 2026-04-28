"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Testimonial } from "@/lib/public-profile/types";

export function TestimonialsEditor({
  value,
  onChange,
}: {
  value: Testimonial[];
  onChange: (next: Testimonial[]) => void;
}) {
  function update(idx: number, patch: Partial<Testimonial>) {
    onChange(value.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...value, { quote: "", author: "", relation: "" }]);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nema dodatih preporuka. Pitaj nekog roditelja ili učenika da napiše
          par rečenica.
        </p>
      )}

      {value.map((t, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-border bg-card/50 p-3 space-y-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Citat
              </Label>
              <Textarea
                rows={3}
                value={t.quote}
                onChange={(e) => update(idx, { quote: e.target.value })}
                placeholder="Šta je rečeno o tebi kao profesoru..."
                className="text-sm"
              />
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
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Ime autora
              </Label>
              <Input
                value={t.author}
                onChange={(e) => update(idx, { author: e.target.value })}
                placeholder="Marija P."
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Uloga (opciono)
              </Label>
              <Input
                value={t.relation ?? ""}
                onChange={(e) => update(idx, { relation: e.target.value })}
                placeholder="Roditelj, učenica 8. razreda..."
                className="h-10 text-sm"
              />
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-3.5" strokeWidth={2} />
        Dodaj preporuku
      </Button>

      <input
        type="hidden"
        name="testimonials"
        value={JSON.stringify(
          value.filter((t) => t.quote.trim() && t.author.trim()),
        )}
      />
    </div>
  );
}
