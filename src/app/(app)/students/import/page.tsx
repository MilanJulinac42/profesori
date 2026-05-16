import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { ImportWizard } from "./_components/import-wizard";

export default function StudentsImportPage() {
  return (
    <div className="px-4 sm:px-8 py-6 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <Link
          href="/students"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 group"
        >
          <ArrowLeft
            className="size-3.5 group-hover:-translate-x-0.5 transition-transform"
            strokeWidth={1.75}
          />
          Nazad na učenike
        </Link>
      </div>

      <header className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl tile-violet shrink-0">
          <Upload className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-foreground tracking-tight">
            Uvoz učenika iz CSV-a
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drop CSV ili izaberi fajl — automatski ću mapirati kolone, pa
            potvrdi pa importujem. Maksimalno 500 učenika odjednom.
          </p>
        </div>
      </header>

      <ImportWizard />
    </div>
  );
}
