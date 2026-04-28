import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function StudentsPage() {
  return (
    <div className="px-4 sm:px-8 py-8 space-y-8 max-w-6xl mx-auto w-full">
      <PageHeader
        title="Učenici"
        description="Tvoja lista učenika, kontakti i osnovni podaci."
        actions={
          <Link href="/students/new" className={buttonVariants({ size: "lg" })}>
            <Plus className="size-4" />
            Dodaj učenika
          </Link>
        }
      />
      <EmptyState
        icon={Users}
        title="Još nemaš učenika"
        description="Dodaj prvog učenika i sve što unosiš ovde će biti vezano za njega: časovi, beleške, naplata, opomene."
        action={
          <Link href="/students/new" className={buttonVariants()}>
            <Plus className="size-4" />
            Dodaj učenika
          </Link>
        }
      />
    </div>
  );
}
