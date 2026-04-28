import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StudentForm } from "../../_components/student-form";
import type { Student } from "@/lib/students/types";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) notFound();
  const student = data as Student;

  return (
    <div className="px-4 sm:px-8 py-6 space-y-8 max-w-3xl mx-auto w-full">
      <Link
        href={`/students/${student.id}`}
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Nazad na profil
      </Link>
      <PageHeader title="Izmeni učenika" description={student.full_name} />
      <StudentForm mode="edit" student={student} />
    </div>
  );
}
