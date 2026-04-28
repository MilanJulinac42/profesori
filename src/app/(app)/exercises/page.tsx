import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function ExercisesPage() {
  return (
    <div className="px-4 sm:px-8 py-8 space-y-8 max-w-6xl mx-auto w-full">
      <PageHeader
        title="Zadaci"
        description="Generiši zadatke i testove pomoću AI-ja, čuvaj ih u banci, eksportuj u PDF."
        actions={
          <Link
            href="/exercises/new"
            className={buttonVariants({ size: "lg" })}
          >
            <Sparkles className="size-4" />
            Generiši zadatke
          </Link>
        }
      />
      <EmptyState
        icon={Sparkles}
        title="Banka zadataka je prazna"
        description="Generiši prvi set zadataka i ostaće sačuvan ovde za buduće korišćenje."
        action={
          <Link href="/exercises/new" className={buttonVariants()}>
            <Sparkles className="size-4" />
            Generiši zadatke
          </Link>
        }
      />
    </div>
  );
}
