import Link from "next/link";
import {
  GraduationCap,
  Users,
  CalendarDays,
  Banknote,
  Sparkles,
  Globe,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </div>
            <span className="font-heading text-xl">Profesori</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Prijavi se
            </Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>
              Probaj besplatno
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 py-20 sm:py-28 text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Za solo profesore privatnih časova
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl leading-[1.05] mt-5">
            Vodi privatne časove,{" "}
            <span className="text-primary">bez haosa.</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
            Učenici, raspored, naplata i AI generator zadataka — na jednom
            mestu. Manje papira, više vremena za predavanje.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link
              href="/signup"
              className={buttonVariants({ size: "lg" })}
            >
              Probaj besplatno
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Već imam nalog
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            14 dana besplatno · bez kartice
          </p>
        </section>

        <section className="px-6 pb-24 max-w-6xl mx-auto">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Users}
              title="Učenici i beleške"
              description="Svaki učenik ima svoju karticu sa istorijom časova i napretkom."
            />
            <FeatureCard
              icon={CalendarDays}
              title="Raspored u 1 kliku"
              description="Ponavljajući termini, drag & drop, podsetnici roditeljima."
            />
            <FeatureCard
              icon={Banknote}
              title="Naplata bez muke"
              description="Vidiš ko duguje koliko. Pošalji opomenu jednim klikom."
            />
            <FeatureCard
              icon={Sparkles}
              title="AI generator zadataka"
              description="Zadaci po razredu, temi i težini. Eksport u PDF."
            />
            <FeatureCard
              icon={Globe}
              title="Javni profil"
              description="Roditelji ti šalju upite preko booking forme."
            />
            <FeatureCard
              icon={GraduationCap}
              title="Predmet-agnostički"
              description="Matematika, fizika, jezici, šta god predaješ."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Profesori</p>
          <p>
            Platforma služi za evidenciju. Novac primaš direktno od učenika.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
        <Icon className="size-5" />
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
    </div>
  );
}
