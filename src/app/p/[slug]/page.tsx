import { notFound } from "next/navigation";
import {
  GraduationCap,
  Mail,
  BookOpen,
  Trophy,
  Monitor,
  Sparkles,
  Quote,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPublishedProfileBySlug } from "@/lib/public-profile/queries";
import { BookingForm } from "./_components/booking-form";
import { cn } from "@/lib/utils";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const profile = await getPublishedProfileBySlug(supabase, slug);
  if (!profile) notFound();

  const stats = [
    { label: "predmet", labelMany: "predmeta", count: profile.subjects.length },
    { label: "nivo", labelMany: "nivoa", count: profile.levels.length },
    { label: "specijalnost", labelMany: "specijalnosti", count: profile.specialties.length },
    { label: "format", labelMany: "formata", count: profile.formats.length },
  ].filter((s) => s.count > 0);

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Top nav */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm">
            <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-background">
              <GraduationCap className="size-3.5" strokeWidth={2} />
            </span>
            <span className="font-medium">profesori.rs</span>
          </span>
          <a
            href="#booking"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Pošalji upit ↓
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Aurora gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 90% at 100% 0%, oklch(0.85 0.16 70 / 0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 0% 50%, oklch(0.7 0.18 145 / 0.14) 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 50% 100%, oklch(0.7 0.18 250 / 0.12) 0%, transparent 60%)",
          }}
        />
        {/* Soft grid */}
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 50% 40%, black 30%, transparent 75%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 py-16 sm:py-24">
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 items-center sm:items-start">
            {/* Avatar with gradient ring */}
            <div className="relative shrink-0">
              <div
                className="absolute -inset-2 rounded-full opacity-50 blur-xl"
                style={{
                  background:
                    "conic-gradient(from 180deg, oklch(0.85 0.16 70 / 0.6), oklch(0.7 0.18 145 / 0.6), oklch(0.7 0.18 250 / 0.6), oklch(0.85 0.16 70 / 0.6))",
                }}
              />
              <Avatar
                name={profile.display_name}
                photoUrl={profile.photo_url}
                className="relative size-32 sm:size-40 text-4xl ring-4 ring-background shadow-2xl"
              />
            </div>

            {/* Identity */}
            <div className="flex-1 space-y-5 min-w-0 text-center sm:text-left">
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-6xl font-medium tracking-tighter leading-[0.95]">
                  {profile.display_name}
                </h1>
                {profile.years_experience && (
                  <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
                    {profile.years_experience}
                  </p>
                )}
              </div>

              {/* Status row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {profile.available_for_new_students ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-1.5 text-sm font-medium">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                    </span>
                    Prima nove učenike
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                    Trenutno ne prima nove
                  </span>
                )}
                {profile.price_range_text && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-4 py-1.5 text-sm font-medium">
                    <Sparkles className="size-3.5" strokeWidth={2} />
                    {profile.price_range_text}
                  </span>
                )}
              </div>

              {/* Hero CTA */}
              {profile.available_for_new_students && (
                <div className="pt-2">
                  <a
                    href="#booking"
                    className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Pošalji upit
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      {stats.length > 0 && (
        <section className="border-y border-border bg-secondary/30">
          <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl sm:text-4xl font-medium tracking-tight tabular-nums">
                  {s.count}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {s.count === 1 ? s.label : s.labelMany}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 sm:py-16 space-y-14">
        {/* Bio */}
        {profile.bio && (
          <section className="relative max-w-3xl">
            <Quote
              className="absolute -top-2 -left-2 size-8 text-muted-foreground/20"
              strokeWidth={1.5}
            />
            <p className="relative text-xl sm:text-2xl leading-relaxed font-light tracking-tight pl-6">
              {profile.bio}
            </p>
          </section>
        )}

        {/* Tag categories */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-medium tracking-tight">Šta predajem</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Predmeti, nivoi i specijalnosti.
            </p>
          </div>
          <div className="space-y-3">
            {profile.subjects.length > 0 && (
              <TagRow
                title="Predmeti"
                icon={BookOpen}
                variant="primary"
                items={profile.subjects}
              />
            )}
            {profile.levels.length > 0 && (
              <TagRow
                title="Nivoi obrazovanja"
                icon={GraduationCap}
                variant="emerald"
                items={profile.levels}
              />
            )}
            {profile.specialties.length > 0 && (
              <TagRow
                title="Specijalnosti i pripreme"
                icon={Trophy}
                variant="amber"
                items={profile.specialties}
              />
            )}
            {profile.formats.length > 0 && (
              <TagRow
                title="Format časova"
                icon={Monitor}
                variant="indigo"
                items={profile.formats}
              />
            )}
          </div>
        </section>

        {/* Booking form */}
        <section
          id="booking"
          className="scroll-mt-20 relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 60% 80% at 100% 0%, oklch(0.85 0.16 70 / 0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 0% 100%, oklch(0.7 0.18 145 / 0.10) 0%, transparent 60%)",
            }}
          />

          <div className="relative space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight">
                {profile.available_for_new_students
                  ? "Pošalji upit"
                  : "Kontakt"}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                {profile.available_for_new_students
                  ? "Popuni kratku formu — javiće ti se uskoro."
                  : "Profesor trenutno ne prima nove učenike, ali možeš poslati upit."}
              </p>
            </div>

            <BookingForm
              organizationId={profile.organization_id}
              defaultSubjects={profile.subjects}
            />
          </div>
        </section>

        {/* Direct contact */}
        {profile.contact_email && (
          <section className="text-center">
            <p className="text-sm text-muted-foreground">Više voliš email?</p>
            <a
              href={`mailto:${profile.contact_email}`}
              className="mt-1 inline-flex items-center gap-2 text-sm text-foreground underline underline-offset-4"
            >
              <Mail className="size-3.5" strokeWidth={1.75} />
              {profile.contact_email}
            </a>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Stranica generisana putem{" "}
            <span className="text-foreground font-medium">profesori.rs</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Privatni časovi · evidencija direktno između profesora i učenika
          </p>
        </div>
      </footer>
    </div>
  );
}

const TAG_VARIANTS = {
  primary: {
    icon: "text-foreground",
    iconBg: "bg-foreground/5 border border-foreground/10",
    pill: "bg-foreground text-background",
  },
  emerald: {
    icon: "text-emerald-600 dark:text-emerald-400",
    iconBg:
      "bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-900/50",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  amber: {
    icon: "text-amber-600 dark:text-amber-400",
    iconBg:
      "bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-900/50",
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  indigo: {
    icon: "text-indigo-600 dark:text-indigo-400",
    iconBg:
      "bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-900/50",
    pill: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
} as const;

function TagRow({
  title,
  icon: Icon,
  variant,
  items,
}: {
  title: string;
  icon: LucideIcon;
  variant: keyof typeof TAG_VARIANTS;
  items: string[];
}) {
  const v = TAG_VARIANTS[variant];
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors">
      <div className="flex items-center gap-3 shrink-0 sm:w-56">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            v.iconBg,
          )}
        >
          <Icon className={cn("size-5", v.icon)} strokeWidth={1.75} />
        </span>
        <span className="font-medium text-sm">{title}</span>
      </div>
      <div className="flex-1 flex flex-wrap gap-1.5 sm:justify-end">
        {items.map((item) => (
          <span
            key={item}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
              v.pill,
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Avatar({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl: string | null;
  className?: string;
}) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-secondary font-medium text-muted-foreground",
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}
