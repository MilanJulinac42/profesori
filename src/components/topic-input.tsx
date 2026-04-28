"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TopicInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Dodaj temu, pa Enter",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [text, setText] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setText("");
      return;
    }
    onChange([...value, tag]);
    setText("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  const filteredSuggestions = suggestions
    .filter(
      (s) => !value.some((t) => t.toLowerCase() === s.toLowerCase()),
    )
    .filter((s) => !text || s.toLowerCase().includes(text.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent p-1.5 min-h-9 dark:bg-input/30",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Ukloni ${tag}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" strokeWidth={2} />
            </button>
          </span>
        ))}
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(text);
            } else if (e.key === "Backspace" && !text && value.length > 0) {
              removeTag(value[value.length - 1]);
            }
          }}
          onBlur={() => addTag(text)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] border-0 bg-transparent shadow-none h-6 px-1 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent"
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[11px] text-muted-foreground self-center mr-1">
            Predlozi:
          </span>
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-md border border-border bg-card hover:bg-secondary px-2 py-0.5 text-[11px] transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
