import Link from "next/link";
import {
  Users,
  CalendarDays,
  Banknote,
  Sparkles,
  Globe,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Bot,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";

type Tile = "cyan" | "magenta" | "violet" | "emerald" | "amber" | "rose" | "sky";

const FEATURES: {
  icon: LucideIcon;
  tile: Tile;
  title: string;
  description: string;
}[] = [
  {
    icon: Users,
    tile: "cyan",
    title: "Učenici i beleške",
    description:
      "Svaki učenik ima karticu sa istorijom časova, napretkom, kontaktima.",
  },
  {
    icon: CalendarDays,
    tile: "violet",
    title: "Raspored u 1 kliku",
    description:
      "Ponavljajući termini, drag & drop, automatski podsetnici roditeljima.",
  },
  {
    icon: Banknote,
    tile: "emerald",
    title: "Naplata bez muke",
    description: "Vidiš ko duguje koliko. Pošalji opomenu jednim klikom.",
  },
  {
    icon: Sparkles,
    tile: "magenta",
    title: "AI generator zadataka",
    description: "Zadaci po razredu, temi i težini. Eksport u PDF za štampu.",
  },
  {
    icon: ClipboardList,
    tile: "amber",
    title: "Domaći i izveštaji",
    description: "Učenici predaju domaći. Šalji nedeljne i mesečne izveštaje.",
  },
  {
    icon: Globe,
    tile: "sky",
    title: "Javni profil",
    description: "Roditelji ti šalju upite preko booking forme na tvom linku.",
  },
  {
    icon: Bot,
    tile: "rose",
    title: "AI Asistent",
    description: "Pitaj prirodnim jezikom, on odradi — zakaži, naplati, piši.",
  },
  {
    icon: GraduationCap,
    tile: "cyan",
    title: "Predmet-agnostički",
    description: "Matematika, fizika, jezici, instrumenti — šta god predaješ.",
  },
];

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex items-center h-9 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Prijavi se
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
            >
              Probaj besplatno
              <ArrowRight className="size-3.5" strokeWidth={2.25} />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-hero-mesh pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
          />
          <div className="relative px-6 pt-20 sm:pt-28 pb-24 text-center">
            <div className="max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 backdrop-blur-sm px-3 py-1 text-xs font-medium">
                <span className="size-1.5 rounded-full bg-brand pulse-dot" />
                <span className="text-muted-foreground">
                  Za solo profesore privatnih časova
                </span>
              </span>
              <h1 className="font-display text-5xl sm:text-7xl text-foreground leading-[1.02] tracking-tight mt-7">
                Vodi privatne časove{" "}
                <em className="not-italic text-brand">bez haosa.</em>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mt-6 max-w-xl mx-auto leading-relaxed">
                Učenici, raspored, naplata i AI asistent — na jednom mestu.
                Manje papira, više vremena za predavanje.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 h-11 px-5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
                >
                  Probaj besplatno
                  <ArrowRight className="size-4" strokeWidth={2.25} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center h-11 px-5 rounded-lg bg-card/70 backdrop-blur-md border border-border text-sm font-medium hover:bg-card transition-colors"
                >
                  Već imam nalog
                </Link>
              </div>
              <p className="inline-flex items-center gap-1.5 mt-5 text-xs text-muted-foreground">
                <CheckCircle2
                  className="size-3.5 text-emerald-500 dark:text-emerald-400"
                  strokeWidth={2.25}
                />
                14 dana besplatno · bez kartice · bez ugovora
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20 sm:py-28 max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">
              Sve što ti treba
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground leading-tight tracking-tight max-w-2xl mx-auto">
              Jedan alat. Sve što administracija privatnih časova traži.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map((f) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                tile={f.tile}
                title={f.title}
                description={f.description}
              />
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 pb-24">
          <div className="max-w-3xl mx-auto card-elevated card-glow rounded-3xl p-10 sm:p-14 text-center bg-hero-mesh relative overflow-hidden">
            <div className="relative">
              <h2 className="font-display text-3xl sm:text-4xl text-foreground leading-tight tracking-tight">
                Spreman da{" "}
                <em className="not-italic text-brand">smiriš haos?</em>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
                Postavi nalog za par minuta. Otkaži kad god — bez pitanja.
              </p>
              <div className="mt-7 flex flex-col items-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 h-11 px-5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
                >
                  Probaj besplatno
                  <ArrowRight className="size-4" strokeWidth={2.25} />
                </Link>
                <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2
                    className="size-3.5 text-emerald-500 dark:text-emerald-400"
                    strokeWidth={2.25}
                  />
                  14 dana besplatno · bez kartice
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <Logo />
          <span>© {new Date().getFullYear()} Profesori</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  tile,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tile: Tile;
}) {
  return (
    <div className="card-elevated card-glow rounded-2xl p-5 transition-all hover:translate-y-[-2px] hover:shadow-[0_20px_48px_-16px_oklch(0_0_0/0.4)]">
      <div
        className={`flex size-10 items-center justify-center rounded-xl tile-${tile} shadow-[0_1px_0_oklch(1_0_0/0.6)_inset]`}
      >
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <h3 className="font-semibold text-foreground mt-4 text-[0.95rem]">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
