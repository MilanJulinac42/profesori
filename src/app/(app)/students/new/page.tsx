import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StudentForm } from "../_components/student-form";

export default function NewStudentPage() {
  return (
    <div className="px-4 sm:px-8 py-6 space-y-8 max-w-3xl mx-auto w-full">
      <Link
        href="/students"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Nazad na učenike
      </Link>
      <PageHeader
        title="Novi učenik"
        description="Unesi osnovne podatke. Sve ostalo (časovi, naplata, beleške) možeš dodati kasnije."
      />
      <StudentForm mode="create" />
    </div>
  );
}
