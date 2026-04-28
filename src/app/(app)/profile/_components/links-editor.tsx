"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SOCIAL_LINK_LABELS,
  SOCIAL_LINK_OPTIONS,
  type SocialLink,
  type SocialLinkType,
} from "@/lib/public-profile/types";
import { SocialIcon } from "@/components/social-icon";

export function LinksEditor({
  value,
  onChange,
}: {
  value: SocialLink[];
  onChange: (next: SocialLink[]) => void;
}) {
  function update(idx: number, patch: Partial<SocialLink>) {
    onChange(value.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...value, { type: "website", url: "" }]);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nema dodatih linkova.
        </p>
      )}

      {value.map((link, idx) => (
        <div
          key={idx}
          className="flex items-end gap-2 rounded-lg border border-border bg-card/50 p-3"
        >
          <div className="space-y-1.5 w-40 shrink-0">
            <Label className="text-xs text-muted-foreground">Tip</Label>
            <Select
              value={link.type}
              onValueChange={(v) =>
                update(idx, { type: (v ?? "website") as SocialLinkType })
              }
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue>
                  {(value: string | null) => (
                    <span className="inline-flex items-center gap-2">
                      <SocialIcon
                        type={(value as SocialLinkType) ?? "website"}
                        className="size-4"
                      />
                      {SOCIAL_LINK_LABELS[
                        (value as SocialLinkType) ?? "website"
                      ]}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_LINK_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    <span className="inline-flex items-center gap-2">
                      <SocialIcon type={t} className="size-4" />
                      {SOCIAL_LINK_LABELS[t]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-muted-foreground">URL</Label>
            <Input
              type="url"
              value={link.url}
              onChange={(e) => update(idx, { url: e.target.value })}
              placeholder="https://..."
              className="h-10 text-sm"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => remove(idx)}
            aria-label="Ukloni link"
            className="text-muted-foreground hover:text-destructive shrink-0"
          >
            <X className="size-4" strokeWidth={1.75} />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-3.5" strokeWidth={2} />
        Dodaj link
      </Button>

      <input
        type="hidden"
        name="links"
        value={JSON.stringify(value.filter((l) => l.url.trim()))}
      />
    </div>
  );
}
