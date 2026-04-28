import Link from "next/link";
import {
  Users,
  CalendarDays,
  Banknote,
  Sparkles,
  Globe,
  GraduationCap,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-1.5">
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
        {/* Hero */}
        <section className="relative px-6 pt-20 sm:pt-28 pb-20 text-center">
          <div className="absolute inset-0 bg-grid pointer-events-none" />
          <div className="relative max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-foreground" />
              Za solo profesore privatnih časova
            </span>
            <h1 className="text-4xl sm:text-6xl font-medium tracking-tight leading-[1.05] mt-6">
              Vodi privatne časove
              <br />
              <span className="text-muted-foreground">bez haosa.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-5 max-w-xl mx-auto">
              Učenici, raspored, naplata i AI generator zadataka — na jednom
              mestu. Manje papira, više vremena za predavanje.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-7">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Probaj besplatno
                <ArrowRight className="size-4" strokeWidth={2} />
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
          </div>
        </section>

        {/* Features */}
        <section className="px-6 pb-24 max-w-6xl mx-auto">
          <div className="border-t border-l border-border grid sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCell
              icon={Users}
              title="Učenici i beleške"
              description="Svaki učenik ima karticu sa istorijom časova i napretkom."
            />
            <FeatureCell
              icon={CalendarDays}
              title="Raspored u 1 kliku"
              description="Ponavljajući termini, drag & drop, podsetnici roditeljima."
            />
            <FeatureCell
              icon={Banknote}
              title="Naplata bez muke"
              description="Vidiš ko duguje koliko. Pošalji opomenu jednim klikom."
            />
            <FeatureCell
              icon={Sparkles}
              title="AI generator zadataka"
              description="Zadaci po razredu, temi i težini. Eksport u PDF."
            />
            <FeatureCell
              icon={Globe}
              title="Javni profil"
              description="Roditelji ti šalju upite preko booking forme."
            />
            <FeatureCell
              icon={GraduationCap}
              title="Predmet-agnostički"
              description="Matematika, fizika, jezici — šta god predaješ."
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

function FeatureCell({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-r border-border p-6">
      <Icon
        className="size-4 text-muted-foreground"
        strokeWidth={1.75}
      />
      <h3 className="text-sm font-medium mt-4">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
