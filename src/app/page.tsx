import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          Profesori
        </h1>
        <p className="text-lg text-muted-foreground">
          Alat za solo profesore privatnih časova. Učenici, raspored, naplata i
          AI generator zadataka — na jednom mestu.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Probaj besplatno
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Prijavi se
          </Link>
        </div>
        <p className="text-xs text-muted-foreground pt-8">
          Platforma služi za evidenciju duga i uplata. Sve novčane transakcije
          odvijaju se direktno između profesora i učenika.
        </p>
      </div>
    </main>
  );
}
