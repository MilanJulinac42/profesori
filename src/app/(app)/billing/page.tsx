import { Banknote } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function BillingPage() {
  return (
    <div className="px-4 sm:px-8 py-8 space-y-8 max-w-6xl mx-auto w-full">
      <PageHeader
        title="Naplata"
        description="Pregled dugovanja, evidentiranje uplata i opomene."
      />
      <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
        <p className="font-medium">Ovo je samo evidencija.</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Novac primaš direktno od učenika ili roditelja. Platforma ne
          procesuje uplate.
        </p>
      </div>
      <EmptyState
        icon={Banknote}
        title="Nema neplaćenih časova"
        description="Kad obeležiš čas kao održan, on automatski ulazi u dug učenika."
      />
    </div>
  );
}
