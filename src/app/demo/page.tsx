import Link from "next/link";
import {
  Wallet,
  CalendarCheck,
  XCircle,
  TrendingDown,
  Banknote,
  StickyNote,
  ClipboardCheck,
  Check,
  ArrowRight,
  Sparkles,
  CalendarDays,
  Clock,
  Mic,
  Trophy,
  CircleDot,
  Bell,
  MessageSquare,
  FileText,
  Wand2,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendBadge } from "@/components/dashboard/trend-badge";
import { formatRsd } from "@/lib/money";
import { cn } from "@/lib/utils";
import { DemoBanner } from "./_components/demo-banner";
import { FakeBarChart } from "./_components/fake-bar-chart";
import {
  DEMO_TEACHER_NAME,
  DEMO_STATS,
  DEMO_DEBTORS,
  DEMO_TOP_STUDENTS,
  DEMO_UPCOMING,
  DEMO_PENDING,
  DEMO_RECENT_ACTIVITY,
  DEMO_MONTHLY_REVENUE,
  DEMO_MONTH_LABELS,
  DEMO_PERIOD_COMPARE_LABEL,
} from "./_components/fake-data";

export const metadata = {
  title: "Demo · Profesori — alat za privatne časove",
  description:
    "Ovako izgleda Profesori — istraži dashboard, raspored i naplatu sa izmišljenim podacima, bez registracije.",
};

function pct(a: number, b: number) {
  if (b === 0) return 0;
  return ((a - b) / b) * 100;
}

const PENDING_ICONS = {
  debt: Banknote,
  notes: StickyNote,
  homework: ClipboardCheck,
} as const;

const PENDING_TILES: Record<string, string> = {
  debt: "tile-rose",
  notes: "tile-amber",
  homework: "tile-emerald",
};

const PENDING_CTA_ICONS = {
  debt: ArrowRight,
  notes: Mic,
  homework: Check,
} as const;

const ACTIVITY_ICONS = {
  payment: Wallet,
  lesson_held: Check,
  booking: MessageSquare,
  reminder: Bell,
} as const;

export default function DemoPage() {
  const revenueDelta = pct(DEMO_STATS.revenue, DEMO_STATS.previousRevenue);
  const heldDelta = pct(DEMO_STATS.held, DEMO_STATS.previousHeld);
  const cancellationDelta = pct(
    DEMO_STATS.cancellationRate,
    DEMO_STATS.previousCancellationRate,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DemoBanner />

      {/* Mini topbar — looks like the real one, locked links */}
      <header className="sticky top-[42px] sm:top-[42px] z-40 h-14 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="h-full max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-3">
          <Logo />
          <span className="hidden sm:inline text-xs text-muted-foreground">
            · {DEMO_TEACHER_NAME}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            aria-label="Notifikacije"
            className="relative inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground"
            disabled
          >
            <Bell className="size-4" strokeWidth={1.75} />
            <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-brand text-brand-foreground text-[9px] font-bold px-1 tabular-nums">
              3
            </span>
          </button>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
          >
            Registruj se besplatno
            <ArrowRight className="size-3.5" strokeWidth={2.25} />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-hero-mesh border border-border/60 dark:border-white/[0.08]">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/15"
          />
          <div className="relative px-6 sm:px-10 py-8 sm:py-10 grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 min-w-0">
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
                <span
                  aria-hidden
                  className="relative inline-block size-2 rounded-full bg-success pulse-dot"
                />
                Ovako izgleda Profesori — ovaj mesec
              </span>
              <h1 className="font-display mt-4 text-[2rem] sm:text-[2.5rem] leading-[1.05] text-foreground">
                Dobar dan.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                6 aktivnih učenika · 8 predstojećih u periodu
              </p>
              <div className="mt-7">
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-2">
                  Zarađeno · ovaj mesec
                </p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span
                    className="font-display text-5xl sm:text-7xl leading-none tabular-nums bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, var(--chart-1) 0%, var(--chart-2) 60%, var(--chart-3) 100%)",
                    }}
                  >
                    {formatRsd(DEMO_STATS.revenue, false)}
                  </span>
                  <span className="text-base sm:text-xl text-muted-foreground font-semibold">
                    RSD
                  </span>
                  <TrendBadge
                    delta={revenueDelta}
                    size="md"
                    className="self-center"
                    compareLabel={DEMO_PERIOD_COMPARE_LABEL}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  ~{formatRsd(DEMO_STATS.averageRevenuePerHeld, false)} po času ·{" "}
                  {DEMO_STATS.held} časova održano
                </p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
                >
                  <Sparkles className="size-4" strokeWidth={2.5} />
                  Registruj se besplatno
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-card/70 backdrop-blur-md border border-border text-sm font-medium hover:bg-card transition-colors"
                >
                  Saznaj više
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 lg:pl-6 lg:border-l lg:border-border/40">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-3">
                Prihod kroz godinu
              </p>
              <FakeBarChart
                values={DEMO_MONTHLY_REVENUE}
                labels={DEMO_MONTH_LABELS}
              />
            </div>
          </div>
        </section>

        {/* Stat row */}
        <section className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Zarađeno"
            value={formatRsd(DEMO_STATS.revenue, false)}
            unit="RSD"
            icon={Wallet}
            tile="cyan"
            delta={revenueDelta}
            hint={`~${formatRsd(DEMO_STATS.averageRevenuePerHeld, false)} po času`}
          />
          <StatCard
            label="Časova održano"
            value={String(DEMO_STATS.held)}
            icon={CalendarCheck}
            tile="violet"
            delta={heldDelta}
            hint={`${DEMO_STATS.scheduled} predstojećih`}
          />
          <StatCard
            label="Otkazivanja"
            value={String(DEMO_STATS.cancelled)}
            icon={XCircle}
            tile="rose"
            inverseTrend
            delta={cancellationDelta}
            hint={
              DEMO_STATS.lostRevenue > 0
                ? `${formatRsd(DEMO_STATS.lostRevenue)} izgubljeno`
                : "bez izgubljenog prihoda"
            }
          />
          <StatCard
            label="Stopa otkazivanja"
            value={`${DEMO_STATS.cancellationRate.toFixed(1)}%`}
            icon={TrendingDown}
            tile="amber"
            inverseTrend
            delta={cancellationDelta}
            hint={`${DEMO_STATS.cancelled} od ${DEMO_STATS.totalLessonsTouched}`}
          />
        </section>

        {/* Bottom grid */}
        <section className="grid gap-5 lg:grid-cols-12">
          {/* Pending + upcoming + activity */}
          <div className="lg:col-span-8 space-y-5 min-w-0">
            {/* Akcije danas */}
            <div className="card-elevated card-glow rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-baseline gap-2.5">
                  <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
                    Akcije danas
                  </h2>
                  <span className="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground tabular-nums">
                    {DEMO_PENDING.length} stavki
                  </span>
                </div>
              </header>
              <ul className="divide-y divide-border">
                {DEMO_PENDING.map((item, i) => {
                  const Icon = PENDING_ICONS[item.kind];
                  const CtaIcon = PENDING_CTA_ICONS[item.kind];
                  const isPrimary = i === 0;
                  return (
                    <li
                      key={item.kind}
                      className="px-5 py-4 flex items-center gap-4"
                    >
                      <div
                        className={cn(
                          "flex size-11 items-center justify-center rounded-xl shrink-0",
                          PENDING_TILES[item.kind],
                        )}
                      >
                        <Icon className="size-5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.95rem] font-semibold truncate text-foreground tracking-tight">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.detail}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[0.8rem] font-semibold shrink-0 cursor-not-allowed",
                          isPrimary
                            ? "bg-brand text-brand-foreground glow-brand"
                            : "bg-secondary text-foreground border border-border/60",
                        )}
                      >
                        <CtaIcon className="size-3.5" strokeWidth={2.25} />
                        {item.cta}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Sledeci casovi */}
            <div className="card-elevated card-glow rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
                  Sledeći časovi
                </h2>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  Otvori raspored
                  <ArrowRight className="size-3" strokeWidth={2} />
                </span>
              </header>
              <ul className="divide-y divide-border">
                {DEMO_UPCOMING.map((l, i) => (
                  <li
                    key={i}
                    className="px-5 py-3 flex items-center gap-4"
                  >
                    <Avatar name={l.name} index={i} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground tracking-tight">
                        {l.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {l.at} · {l.duration} min
                      </p>
                    </div>
                    <ArrowRight
                      className="size-3.5 text-muted-foreground/40"
                      strokeWidth={2}
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent activity */}
            <div className="card-elevated card-glow rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
                  Skorašnja aktivnost
                </h2>
              </header>
              <ul className="divide-y divide-border">
                {DEMO_RECENT_ACTIVITY.map((ev, i) => {
                  const Icon = ACTIVITY_ICONS[ev.kind];
                  return (
                    <li
                      key={i}
                      className="px-5 py-3 flex items-center gap-3"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-secondary shrink-0">
                        <Icon
                          className="size-3.5 text-muted-foreground"
                          strokeWidth={2}
                        />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          <span className="font-medium">{ev.label}</span>
                          <span className="text-muted-foreground"> · {ev.detail}</span>
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {ev.when}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Right column */}
          <aside className="lg:col-span-4 space-y-5 min-w-0">
            {/* Top students */}
            <div className="card-elevated card-glow rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
                  Najbolji učenici
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  po prihodu u periodu
                </p>
              </header>
              <ul className="space-y-3.5 px-5 py-4">
                {DEMO_TOP_STUDENTS.map((s, i) => {
                  const max = Math.max(...DEMO_TOP_STUDENTS.map((x) => x.revenue));
                  const pctW = (s.revenue / max) * 100;
                  return (
                    <li key={s.name}>
                      <span className="flex items-center gap-3">
                        <span className="text-[11px] tabular-nums text-muted-foreground w-3 text-right">
                          {i + 1}
                        </span>
                        <Avatar name={s.name} index={i} />
                        <span className="flex-1 min-w-0">
                          <span className="flex items-baseline justify-between gap-2 mb-1">
                            <span className="text-sm font-medium truncate">
                              {s.name}
                            </span>
                            <span className="text-xs font-semibold tabular-nums text-foreground shrink-0">
                              {formatRsd(s.revenue)}
                            </span>
                          </span>
                          <span className="block h-1.5 rounded-full bg-secondary overflow-hidden">
                            <span
                              className="block h-full rounded-full"
                              style={{
                                width: `${pctW}%`,
                                background: `var(--chart-${(i % 5) + 1})`,
                              }}
                            />
                          </span>
                          <span className="block text-[11px] text-muted-foreground mt-1">
                            {s.lessons} {s.lessons === 1 ? "čas" : s.lessons < 5 ? "časa" : "časova"}
                          </span>
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Cancellation breakdown */}
            <div className="card-elevated card-glow rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
                  Otkazivanja po razlogu
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {DEMO_STATS.cancelled} ukupno
                </p>
              </header>
              <ul className="space-y-2.5 px-5 py-4">
                <CancelRow label="Otkazao učenik" count={1} color="var(--chart-2)" />
                <CancelRow label="Otkazao profesor" count={1} color="var(--chart-3)" />
                <CancelRow label="Nije se pojavio" count={0} color="var(--destructive)" />
              </ul>
            </div>
          </aside>
        </section>

        {/* Feature highlights below the dashboard */}
        <section className="rounded-3xl bg-gradient-to-br from-card to-secondary/40 border border-border/60 px-6 sm:px-10 py-10 sm:py-14 text-center space-y-6">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
            Sve što radiš svaki dan
          </p>
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight max-w-2xl mx-auto">
            Učenici, raspored, naplata i izveštaji — na jednom mestu.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <Feature
              icon={CalendarDays}
              tile="cyan"
              title="Raspored"
              desc="Drag-and-drop, ponavljajući časovi, preskoči raspust."
            />
            <Feature
              icon={Wallet}
              tile="rose"
              title="Naplata bez papira"
              desc="Vidiš ko duguje, šalješ opomenu kroz WhatsApp."
            />
            <Feature
              icon={Sparkles}
              tile="violet"
              title="AI asistent"
              desc="Diktiraj glasovne beleške, kreiraj domaće, brzo navigiraj."
            />
            <Feature
              icon={FileText}
              tile="amber"
              title="Automatski izveštaji"
              desc="Nedeljni i mesečni rezime za roditelje — pošalje se sam."
            />
          </div>
        </section>

        {/* Final CTA */}
        <section className="rounded-3xl border border-border bg-card p-10 sm:p-14 text-center space-y-5">
          <Trophy className="size-10 mx-auto text-brand" strokeWidth={1.5} />
          <h2 className="font-display text-2xl sm:text-3xl">
            Spreman si da preuzmeš svoj raspored?
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            14 dana besplatno, bez kartice. Sve što vidiš na demou možeš da
            podesiš za par minuta.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
            >
              <Sparkles className="size-4" strokeWidth={2.5} />
              Registruj se besplatno
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 h-11 px-4 rounded-lg bg-card border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              Imam nalog
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Avatar({ name, index }: { name: string; index: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const gradients = [
    "linear-gradient(135deg, var(--chart-1), var(--chart-5))",
    "linear-gradient(135deg, var(--chart-2), var(--chart-1))",
    "linear-gradient(135deg, var(--chart-3), var(--chart-2))",
    "linear-gradient(135deg, var(--chart-4), var(--chart-1))",
    "linear-gradient(135deg, var(--chart-5), var(--chart-2))",
  ];
  return (
    <span
      className="flex size-8 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_6px_-2px_rgba(0,0,0,0.4)] shrink-0"
      style={{ background: gradients[index % gradients.length] }}
    >
      {initials || "?"}
    </span>
  );
}

function CancelRow({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <li className="flex items-center gap-2.5 text-xs">
      <span
        className="size-2.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span className="text-muted-foreground flex-1 truncate">{label}</span>
      <span className="text-foreground font-medium tabular-nums">{count}</span>
    </li>
  );
}

function Feature({
  icon: Icon,
  tile,
  title,
  desc,
}: {
  icon: typeof Wallet;
  tile: "cyan" | "magenta" | "violet" | "emerald" | "amber" | "rose" | "sky";
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl bg-background/40 border border-border/60 p-5">
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-lg mb-3",
          `tile-${tile}`,
        )}
      >
        <Icon className="size-4" strokeWidth={2} />
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
