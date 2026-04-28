import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function SchedulePage() {
  return (
    <div className="px-4 sm:px-8 py-8 space-y-8 max-w-6xl mx-auto w-full">
      <PageHeader
        title="Raspored"
        description="Kalendar časova: zakaži, pomeri, obeleži kao završen."
      />
      <EmptyState
        icon={CalendarDays}
        title="Raspored je prazan"
        description="Da bi zakazao prvi čas, prvo dodaj učenika u sekciji Učenici."
      />
    </div>
  );
}
