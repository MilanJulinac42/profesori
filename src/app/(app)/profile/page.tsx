import { Globe } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function PublicProfilePage() {
  return (
    <div className="px-4 sm:px-8 py-8 space-y-8 max-w-6xl mx-auto w-full">
      <PageHeader
        title="Javni profil"
        description="Stranica koju roditelji vide kad im pošalješ link."
      />
      <EmptyState
        icon={Globe}
        title="Profil još nije aktiviran"
        description="Postavi foto, biografiju i predmete koje predaješ. Kad aktiviraš, dobićeš javni link sa booking formom."
      />
    </div>
  );
}
