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
  X,
  Mail,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { createClient } from "@/lib/supabase/server";
import { AuthPreview } from "./(auth)/_components/auth-preview";
import {
  AIAsistentPreview,
  PublicProfilePreview,
  ParentPortalPreview,
  ExercisePreview,
} from "./_landing/previews";

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
    title: "Evidencija časova",
    description:
      "Kompletna istorija svakog učenika — datumi, teme, beleške, ocene.",
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

const FAQ: { q: string; a: string }[] = [
  {
    q: "Da li ovo prijavljuje poreskoj upravi?",
    a: "Ne. Platforma služi isključivo za tvoju internu evidenciju. Niko van tebe — uključujući poreske organe — nema pristup. Nije fiskalna kasa, ne integriše se sa državnim sistemima.",
  },
  {
    q: "Da li je besplatno?",
    a: "14 dana koristiš besplatno, bez kartice. Posle toga jednostavna mesečna pretplata sa otkazivanjem u bilo koje vreme — bez ugovora i bez skrivenih klauzula.",
  },
  {
    q: "Mogu li da preselim podatke ako odem?",
    a: "Da, u bilo kom trenutku. U Podešavanjima imaš opciju da izvezeš sve svoje podatke (učenici, časovi, uplate, beleške) u Excel ili JSON. Tvoji podaci su tvoji.",
  },
  {
    q: "Šta sa roditeljima koji nisu na WhatsApp-u?",
    a: "Sve poruke i izveštaji se mogu poslati i preko email-a. Roditelj dobija privatni link na kome vidi sve o detetu, bez potrebe da pravi nalog.",
  },
  {
    q: "Da li podržava grupne časove?",
    a: "Trenutno fokus je na 1-na-1 časove (standardni privatni časovi). Grupni časovi su na roadmap-u za 2026.",
  },
  {
    q: "Koji predmeti rade?",
    a: "Bilo koji — matematika, fizika, hemija, jezici, programiranje, muzika. AI generator zadataka trenutno najbolje radi za matematiku, ali ostali deli platforme su predmet-agnostički.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const logoHref = user ? "/dashboard" : "/";

  return (
    <div className="flex-1 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Logo href={logoHref} />
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center h-9 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Prijavi se
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand whitespace-nowrap"
            >
              <span className="sm:hidden">Probaj</span>
              <span className="hidden sm:inline">Probaj besplatno</span>
              <ArrowRight className="size-3.5" strokeWidth={2.25} />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-hero-mesh pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
          />
          <div className="relative max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 grid lg:grid-cols-[1fr_minmax(420px,500px)] gap-10 lg:gap-14 items-center">
            {/* Left — pitch */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 backdrop-blur-sm px-3 py-1 text-xs font-medium">
                <span className="size-1.5 rounded-full bg-brand pulse-dot" />
                <span className="text-muted-foreground">
                  Za solo profesore privatnih časova
                </span>
              </span>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-foreground leading-[1.02] tracking-tight mt-6">
                Vodi privatne časove{" "}
                <em className="not-italic text-brand">bez haosa.</em>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mt-5 max-w-xl lg:max-w-md leading-relaxed mx-auto lg:mx-0">
                Učenici, raspored, naplata i AI asistent — na jednom mestu.
                Manje papira, više vremena za predavanje.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 h-11 px-5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
                >
                  Probaj besplatno
                  <ArrowRight className="size-4" strokeWidth={2.25} />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center h-11 px-5 rounded-lg bg-card/70 backdrop-blur-md border border-border text-sm font-medium hover:bg-card transition-colors"
                >
                  Pogledaj demo
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

            {/* Right — product preview */}
            <div className="hidden lg:block">
              <AuthPreview />
            </div>
          </div>
        </section>

        {/* PRE / POSLE COMPARISON */}
        <section className="px-6 py-20 sm:py-28 max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-14">
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">
              Zašto Profesori
            </p>
            <h2 className="font-display text-3xl sm:text-5xl text-foreground leading-[1.05] tracking-tight max-w-2xl mx-auto">
              Manje haosa.{" "}
              <em className="not-italic text-brand">Više predavanja.</em>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Pre */}
            <div className="card-elevated rounded-2xl p-6 sm:p-7 relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex size-9 items-center justify-center rounded-xl tile-rose shrink-0">
                  <X className="size-4" strokeWidth={2.5} />
                </div>
                <h3 className="font-display text-xl text-foreground">
                  Bez Profesori
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <ComparisonRow neg>Excel za učenike</ComparisonRow>
                <ComparisonRow neg>Google Calendar za raspored</ComparisonRow>
                <ComparisonRow neg>
                  WhatsApp poruke jedan po jedan
                </ComparisonRow>
                <ComparisonRow neg>Word/papir za izveštaje</ComparisonRow>
                <ComparisonRow neg>
                  Beleške posle časa u svesci — koje se gube
                </ComparisonRow>
                <ComparisonRow neg>Zadaci iz udžbenika ručno</ComparisonRow>
                <ComparisonRow neg>Roditelji ne znaju šta dete radi</ComparisonRow>
              </ul>
            </div>

            {/* Posle */}
            <div className="card-elevated card-glow rounded-2xl p-6 sm:p-7 relative overflow-hidden bg-hero-mesh">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex size-9 items-center justify-center rounded-xl tile-emerald shrink-0">
                  <CheckCircle2 className="size-5" strokeWidth={2.5} />
                </div>
                <h3 className="font-display text-xl text-foreground">
                  Sa Profesori
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-foreground/90">
                <ComparisonRow>Učenici sa istorijom časova</ComparisonRow>
                <ComparisonRow>Raspored sa drag & drop</ComparisonRow>
                <ComparisonRow>Bulk poruke + AI parser dolaznih</ComparisonRow>
                <ComparisonRow>Automatski izveštaji emailom</ComparisonRow>
                <ComparisonRow>
                  Beleške posle časa povezane sa učenikom
                </ComparisonRow>
                <ComparisonRow>AI generator + PDF</ComparisonRow>
                <ComparisonRow>Privatni roditeljski portal</ComparisonRow>
              </ul>
            </div>
          </div>
        </section>

        {/* AI SPOTLIGHT */}
        <section className="px-6 py-20 sm:py-24 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <AIAsistentPreview />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="inline-flex size-6 items-center justify-center rounded-md tile-violet shrink-0"
                >
                  <Bot className="size-3.5" strokeWidth={2.25} />
                </span>
                <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-brand">
                  AI Asistent
                </span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl text-foreground leading-tight tracking-tight">
                Pričaj normalno —{" "}
                <em className="not-italic text-brand">on odradi posao.</em>
              </h2>
              <p className="text-base text-muted-foreground mt-4 leading-relaxed">
                AI razume šta tražiš na srpskom, predlaže akciju i potvrđuje pre
                nego što išta uradi. Nema kompleksnih menija.
              </p>
              <ul className="mt-6 space-y-3">
                <BulletWithExample
                  label="Pretrazi učenike"
                  example="“Daj mi istoriju za Marka”"
                />
                <BulletWithExample
                  label="Zakaži časove"
                  example="“Zakaži Markov sledeći čas utorak u 17h”"
                />
                <BulletWithExample
                  label="Praćenje napretka"
                  example="“Koji učenici nisu predali poslednji domaći?”"
                />
                <BulletWithExample
                  label="Otkaži / pomeri"
                  example="“Otkaži Markov sledeći čas, otkazao učenik”"
                />
              </ul>
            </div>
          </div>
        </section>

        {/* EXERCISE GENERATOR SPOTLIGHT */}
        <section className="px-6 py-20 sm:py-24 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="inline-flex size-6 items-center justify-center rounded-md tile-magenta shrink-0"
                >
                  <Sparkles className="size-3.5" strokeWidth={2.25} />
                </span>
                <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-brand">
                  AI Generator zadataka
                </span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl text-foreground leading-tight tracking-tight">
                Zadaci za 10 sekundi.{" "}
                <em className="not-italic text-brand">Sa rešenjima.</em>
              </h2>
              <p className="text-base text-muted-foreground mt-4 leading-relaxed">
                Biraš predmet, temu, razred i težinu. AI piše originalne zadatke
                sa tačnim rešenjima i objašnjenjima postupka. Štampa u PDF za
                domaći.
              </p>
              <ul className="mt-6 space-y-3">
                <FeatureCheck>4 nivoa težine + custom napomene</FeatureCheck>
                <FeatureCheck>KaTeX renderovanje formula</FeatureCheck>
                <FeatureCheck>Banka zadataka — koristi ponovo</FeatureCheck>
                <FeatureCheck>Eksport u PDF</FeatureCheck>
              </ul>
            </div>
            <div>
              <ExercisePreview />
            </div>
          </div>
        </section>

        {/* PUBLIC PROFILE SPOTLIGHT */}
        <section className="px-6 py-20 sm:py-24 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <PublicProfilePreview />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="inline-flex size-6 items-center justify-center rounded-md tile-sky shrink-0"
                >
                  <Globe className="size-3.5" strokeWidth={2.25} />
                </span>
                <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-brand">
                  Javni profil
                </span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl text-foreground leading-tight tracking-tight">
                Tvoj{" "}
                <em className="not-italic text-brand">profesionalni</em> link.
              </h2>
              <p className="text-base text-muted-foreground mt-4 leading-relaxed">
                Magazinski profil sa biografijom, cenovnikom, preporukama i
                booking formom. Pošalji link roditeljima ili stavi u Instagram
                bio.
              </p>
              <ul className="mt-6 space-y-3">
                <FeatureCheck>Predmeti, nivoi, specijalnosti</FeatureCheck>
                <FeatureCheck>FAQ i video predstavljanje</FeatureCheck>
                <FeatureCheck>Preporuke roditelja sa zvezdicama</FeatureCheck>
                <FeatureCheck>
                  Booking forma — upiti idu u tvoj Inbox
                </FeatureCheck>
              </ul>
            </div>
          </div>
        </section>

        {/* PARENT PORTAL SPOTLIGHT */}
        <section className="px-6 py-20 sm:py-24 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="inline-flex size-6 items-center justify-center rounded-md tile-emerald shrink-0"
                >
                  <Users className="size-3.5" strokeWidth={2.25} />
                </span>
                <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-brand">
                  Roditeljski portal
                </span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl text-foreground leading-tight tracking-tight">
                Roditelji vide{" "}
                <em className="not-italic text-brand">sve što treba.</em>
              </h2>
              <p className="text-base text-muted-foreground mt-4 leading-relaxed">
                Privatni link bez naloga. Roditelj vidi napredak, beleške
                profesora, sledeći čas i poslate izveštaje. Bez slanja screenshot-a.
              </p>
              <ul className="mt-6 space-y-3">
                <FeatureCheck>Progress score sa trendom</FeatureCheck>
                <FeatureCheck>90-dnevni heatmap aktivnosti</FeatureCheck>
                <FeatureCheck>Beleške posle časova + ocene</FeatureCheck>
                <FeatureCheck>
                  Istorija domaćih i izveštaja na jednom mestu
                </FeatureCheck>
              </ul>
            </div>
            <div>
              <ParentPortalPreview />
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="px-6 py-20 sm:py-28 max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">
              Sve što ti treba
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground leading-tight tracking-tight max-w-2xl mx-auto">
              Jedan alat. Sva administracija privatnih časova.
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

        {/* FAQ */}
        <section className="px-6 py-20 sm:py-24 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">
              Često postavljana pitanja
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground leading-tight tracking-tight">
              Pitanja koja{" "}
              <em className="not-italic text-brand">svako</em> postavi.
            </h2>
          </div>
          <div className="card-elevated card-glow rounded-2xl divide-y divide-border overflow-hidden">
            {FAQ.map((item, i) => (
              <details key={i} className="group">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-secondary/30 transition-colors">
                  <span className="text-[0.95rem] font-semibold text-foreground">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="text-muted-foreground group-open:rotate-45 transition-transform shrink-0 text-xl leading-none"
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
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

/* ---------- helpers ---------- */

function ComparisonRow({
  children,
  neg,
}: {
  children: React.ReactNode;
  neg?: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5">
      {neg ? (
        <X
          className="size-4 text-rose-500/70 dark:text-rose-400/70 shrink-0 mt-0.5"
          strokeWidth={2.5}
        />
      ) : (
        <CheckCircle2
          className="size-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5"
          strokeWidth={2.25}
        />
      )}
      <span>{children}</span>
    </li>
  );
}

function BulletWithExample({
  label,
  example,
}: {
  label: string;
  example: string;
}) {
  return (
    <li className="space-y-1">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground italic">{example}</p>
    </li>
  );
}

function FeatureCheck({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-foreground/90">
      <CheckCircle2
        className="size-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5"
        strokeWidth={2.25}
      />
      <span>{children}</span>
    </li>
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
