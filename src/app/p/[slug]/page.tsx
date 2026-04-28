import { notFound } from "next/navigation";
import {
  GraduationCap,
  Mail,
  BookOpen,
  Trophy,
  Monitor,
  Sparkles,
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

  return (
    <div className="flex-1 flex flex-col bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="size-4" strokeWidth={1.75} />
            profesori.rs
          </span>
        </div>
      </header>

      {/* Hero with gradient */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 80% at 100% 0%, oklch(0.85 0.15 70 / 0.15) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 0% 100%, oklch(0.7 0.15 200 / 0.12) 0%, transparent 50%), radial-gradient(ellipse 40% 50% at 50% 0%, oklch(0.7 0.18 145 / 0.10) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%)",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-6 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <Avatar
              name={profile.display_name}
              photoUrl={profile.photo_url}
              className="size-28 text-2xl ring-4 ring-background shadow-lg"
            />
            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <h1 className="text-3xl sm:text-4xl font-medium tracking-tight">
                  {profile.display_name}
                </h1>
                {profile.years_experience && (
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {profile.years_experience}
                  </p>
                )}
              </div>

              {/* Status pills row */}
              <div className="flex flex-wrap items-center gap-2">
                {profile.available_for_new_students ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-xs font-medium">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Prima nove učenike
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                    Trenutno ne prima
                  </span>
                )}
                {profile.price_range_text && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1 text-xs font-medium">
                    <Sparkles className="size-3" strokeWidth={2} />
                    {profile.price_range_text}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 sm:py-12 space-y-10">
        {/* Tag categories */}
        <div className="grid sm:grid-cols-2 gap-5">
          {profile.subjects.length > 0 && (
            <TagGroup
              title="Predmeti"
              icon={BookOpen}
              variant="primary"
              items={profile.subjects}
            />
          )}
          {profile.levels.length > 0 && (
            <TagGroup
              title="Nivoi obrazovanja"
              icon={GraduationCap}
              variant="emerald"
              items={profile.levels}
            />
          )}
          {profile.specialties.length > 0 && (
            <TagGroup
              title="Specijalnosti i pripreme"
              icon={Trophy}
              variant="amber"
              items={profile.specialties}
            />
          )}
          {profile.formats.length > 0 && (
            <TagGroup
              title="Format časova"
              icon={Monitor}
              variant="indigo"
              items={profile.formats}
            />
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              O profesoru
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          </section>
        )}

        {/* Booking form */}
        <section>
          <div className="border-t border-border pt-8 space-y-2">
            <h2 className="text-xl font-medium tracking-tight">
              {profile.available_for_new_students
                ? "Pošalji upit"
                : "Kontakt"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile.available_for_new_students
                ? "Popuni formu, profesor će ti se javiti u najkraćem mogućem roku."
                : "Profesor trenutno ne prima nove učenike, ali možeš poslati upit."}
            </p>
          </div>
          <div className="mt-6">
            <BookingForm
              organizationId={profile.organization_id}
              defaultSubjects={profile.subjects}
            />
          </div>
        </section>

        {profile.contact_email && (
          <section className="border-t border-border pt-6">
            <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
              <Mail className="size-3.5" strokeWidth={1.75} />
              Direktan kontakt:{" "}
              <a
                href={`mailto:${profile.contact_email}`}
                className="text-foreground underline underline-offset-4"
              >
                {profile.contact_email}
              </a>
            </p>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-6">
        <p className="max-w-4xl mx-auto px-6 text-xs text-muted-foreground">
          Stranica generisana putem{" "}
          <span className="text-foreground">profesori.rs</span>
        </p>
      </footer>
    </div>
  );
}

const TAG_VARIANTS = {
  primary: {
    icon: "text-foreground",
    iconBg: "bg-foreground/5",
    title: "text-foreground",
    pill: "bg-foreground text-background",
  },
  emerald: {
    icon: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "text-foreground",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  amber: {
    icon: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    title: "text-foreground",
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  indigo: {
    icon: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
    title: "text-foreground",
    pill: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
} as const;

function TagGroup({
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
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-md",
            v.iconBg,
          )}
        >
          <Icon className={cn("size-3.5", v.icon)} strokeWidth={1.75} />
        </span>
        <h3 className={cn("text-xs uppercase tracking-wider", v.title)}>
          {title}
        </h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
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
