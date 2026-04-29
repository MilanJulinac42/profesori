"use client";

import { useState, useTransition } from "react";
import { Download, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportOrgData } from "@/lib/settings/actions";

export function DataExportCard() {
  const [pending, startTransition] = useTransition();

  function downloadJson() {
    startTransition(async () => {
      try {
        const data = await exportOrgData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `profesori-eksport-${new Date()
          .toISOString()
          .slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("Podaci preuzeti");
      } catch (e) {
        toast.error("Greška pri eksportu", {
          description: (e as Error).message,
        });
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-medium inline-flex items-center gap-2">
          <ShieldCheck className="size-4" strokeWidth={1.75} />
          Eksport podataka (GDPR)
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Preuzmi sve svoje podatke u JSON formatu.
        </p>
      </div>
      <div className="px-5 py-5 space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Generiše JSON fajl sa: organizacija, korisnici, učenici, časovi,
          uplate, opomene, booking upiti, javni profil. Sve što imamo o tebi.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={downloadJson}
          disabled={pending}
        >
          <Download className="size-3.5" strokeWidth={1.75} />
          {pending ? "Generišem..." : "Preuzmi podatke (.json)"}
        </Button>
      </div>
    </div>
  );
}
