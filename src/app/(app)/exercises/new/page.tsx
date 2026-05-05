import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GeneratorWizard } from "./_components/wizard";

export default function NewExercisePage() {
  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-3xl mx-auto w-full">
      <Link
        href="/exercises"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Nazad na zadatke
      </Link>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-medium tracking-tight">Generiši zadatke</h1>
        <p className="text-sm text-muted-foreground">
          Popuni parametre, AI generiše set, a ti odlučuješ da li ide u banku.
        </p>
      </div>

      <GeneratorWizard />
    </div>
  );
}
