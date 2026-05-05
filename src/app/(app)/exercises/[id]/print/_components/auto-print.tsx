"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Trigger-uje native print dialog odmah po učitavanju.
 * Korisnik može da odustane (Cancel u browser dialog-u).
 */
export function AutoPrint() {
  useEffect(() => {
    // mali delay da se font-ovi/stilovi učitaju
    const t = window.setTimeout(() => {
      window.print();
    }, 250);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}

export function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Printer className="size-3.5" strokeWidth={1.75} />
      Štampaj
    </Button>
  );
}
