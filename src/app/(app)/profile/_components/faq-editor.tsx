"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FaqItem } from "@/lib/public-profile/types";

export function FaqEditor({
  value,
  onChange,
}: {
  value: FaqItem[];
  onChange: (next: FaqItem[]) => void;
}) {
  function update(idx: number, patch: Partial<FaqItem>) {
    onChange(value.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...value, { question: "", answer: "" }]);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nema pitanja. Dodaj uobičajena pitanja roditelja (npr. "Da li dolazite
          kući?", "Kako se plaćaju časovi?", "Koliko traje čas?").
        </p>
      )}

      {value.map((item, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-border bg-card/50 p-3 space-y-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pitanje</Label>
              <Input
                value={item.question}
                onChange={(e) => update(idx, { question: e.target.value })}
                placeholder="Da li dolazite kući?"
                className="h-10 text-sm"
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
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Odgovor</Label>
            <Textarea
              rows={3}
              value={item.answer}
              onChange={(e) => update(idx, { answer: e.target.value })}
              placeholder="Da, dolazim kući unutar Beograda za dodatnih 500 RSD po času..."
              className="text-sm"
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-3.5" strokeWidth={2} />
        Dodaj pitanje
      </Button>

      <input
        type="hidden"
        name="faq_items"
        value={JSON.stringify(
          value.filter((q) => q.question.trim() && q.answer.trim()),
        )}
      />
    </div>
  );
}
