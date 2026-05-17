import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCurriculumWithUnits,
  listOrgSubjects,
} from "@/lib/curriculum/queries";
import { CurriculumEditor } from "./_components/editor";

export default async function CurriculumEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [data, subjects] = await Promise.all([
    getCurriculumWithUnits(supabase, id),
    listOrgSubjects(supabase),
  ]);
  if (!data) notFound();

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
      <Link
        href="/curricula"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 group"
      >
        <ArrowLeft
          className="size-3.5 group-hover:-translate-x-0.5 transition-transform"
          strokeWidth={1.75}
        />
        Svi kurikulumi
      </Link>

      <CurriculumEditor curriculum={data} subjectSuggestions={subjects} />
    </div>
  );
}
