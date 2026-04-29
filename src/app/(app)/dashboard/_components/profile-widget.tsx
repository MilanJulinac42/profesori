"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Globe, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompletenessResult } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";

export function ProfileWidget({
  slug,
  published,
  availableForNewStudents,
  completeness,
}: {
  slug: string;
  published: boolean;
  availableForNewStudents: boolean;
  completeness: CompletenessResult;
}) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-medium">Javni profil</h2>
          <StatusPill published={published} />
        </div>
        <Link
          href="/profile"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <Pencil className="size-3" strokeWidth={1.75} />
          Uredi
        </Link>
      </div>

      <div className="grid sm:grid-cols-[1fr_280px] gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {/* Left: link + status */}
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Tvoj link
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2 font-mono text-sm">
                <span className="text-muted-foreground">/p/</span>
                <span className="font-medium truncate">{slug}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyLink}
              >
                {copied ? (
                  <>
                    <Check className="size-3.5" strokeWidth={2} />
                    Kopirano
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" strokeWidth={1.75} />
                    Kopiraj
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {published ? (
              <Link
                href={`/p/${slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3.5 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="size-3" strokeWidth={2} />
                Otvori javnu stranicu
              </Link>
            ) : (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3.5 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Objavi profil
              </Link>
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs",
                availableForNewStudents
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  availableForNewStudents
                    ? "bg-emerald-500"
                    : "bg-muted-foreground/50",
                )}
              />
              {availableForNewStudents
                ? "Prima nove učenike"
                : "Trenutno ne prima"}
            </span>
          </div>
        </div>

        {/* Right: completeness */}
        <div className="p-5 space-y-3">
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Profil kompletan
              </p>
              <p className="text-sm font-medium tabular-nums">
                {completeness.score}%
              </p>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-foreground transition-all"
                style={{ width: `${completeness.score}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 tabular-nums">
              {completeness.filled}/{completeness.total} sekcija popunjeno
            </p>
          </div>
          {completeness.missing.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">Fali:</p>
              <div className="flex flex-wrap gap-1">
                {completeness.missing.slice(0, 3).map((m) => (
                  <span
                    key={m}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                  >
                    {m}
                  </span>
                ))}
                {completeness.missing.length > 3 && (
                  <span className="text-[11px] px-2 py-0.5 text-muted-foreground">
                    +{completeness.missing.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium",
        published
          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
          : "bg-secondary text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          published ? "bg-emerald-500" : "bg-muted-foreground/50",
        )}
      />
      {published ? "Objavljen" : "Draft"}
    </span>
  );
}
