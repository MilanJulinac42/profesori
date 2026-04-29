import { ArrowRight, GraduationCap, MapPin, Sparkles } from "lucide-react";
import type { PublicProfile, SocialLink } from "@/lib/public-profile/types";
import { SOCIAL_LINK_LABELS } from "@/lib/public-profile/types";
import type { ThemeDef } from "@/lib/public-profile/themes";
import {
  normalizeSections,
  shouldRenderSection,
} from "@/lib/public-profile/sections";
import { SocialIcon } from "@/components/social-icon";
import { cn } from "@/lib/utils";

import { StickyCta } from "../_components/sticky-cta";
import { QuickContactDock } from "../_components/quick-contact-dock";
import { StatsSection } from "../_sections/stats";
import { BookingSection } from "../_sections/booking";
import { SectionRenderer } from "../_shared/section-renderer";
import { Avatar } from "../_shared/avatar";
import { Reveal } from "@/components/reveal";

/**
 * Card layout — single big rounded card centered on a soft gradient background.
 */
export function CardLayout({
  profile,
  theme,
}: {
  profile: PublicProfile;
  theme: ThemeDef;
}) {
  const sections = normalizeSections(profile.sections);
  const statsSection = sections.find((s) => s.type === "stats");
  const showStats =
    statsSection?.visible && shouldRenderSection("stats", profile);
  const mainSections = sections.filter(
    (s) =>
      s.type !== "stats" &&
      s.type !== "direct_contact" &&
      s.visible &&
      shouldRenderSection(s.type, profile),
  );

  return (
    <div
      className={cn(
        "flex-1 flex flex-col bg-secondary/30 relative",
        theme.serifHeadings && "theme-editorial",
      )}
    >
      {/* Page-level decorative gradient */}
      {theme.heroBg && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: theme.heroBg }}
        />
      )}

      <header className="relative border-b border-border bg-background/60 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
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

      <main className="relative flex-1 px-4 sm:px-6 py-10 sm:py-16">
        {/* The big card */}
        <article className="max-w-3xl mx-auto rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Card top: identity */}
          <div className="relative px-6 sm:px-10 pt-10 pb-8 flex flex-col items-center text-center">
            {theme.cardAccentBg && (
              <div
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{ backgroundImage: theme.cardAccentBg }}
              />
            )}
            <div className="relative space-y-4">
              <div className="relative inline-block">
                {theme.avatarRing && (
                  <div
                    className="absolute -inset-2 rounded-full opacity-50 blur-xl"
                    style={{ background: theme.avatarRing }}
                  />
                )}
                <Avatar
                  name={profile.display_name}
                  photoUrl={profile.photo_url}
                  className="relative size-24 sm:size-28 text-3xl ring-4 ring-background shadow-lg"
                />
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-medium tracking-tight">
                  {profile.display_name}
                </h1>
                {profile.years_experience && (
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {profile.years_experience}
                  </p>
                )}
                {profile.location && (
                  <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                    <MapPin className="size-3" strokeWidth={1.75} />
                    {profile.location}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {profile.available_for_new_students ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-xs font-medium">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
                    </span>
                    Prima nove učenike
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                    <span className="size-1 rounded-full bg-muted-foreground/50" />
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

              {profile.links.length > 0 && (
                <SocialLinksRow links={profile.links} />
              )}

              {profile.available_for_new_students && (
                <div className="pt-2">
                  <a
                    href="#booking"
                    className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Pošalji upit
                    <ArrowRight className="size-3.5" strokeWidth={2} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Body sections inside card */}
          <div className="px-6 sm:px-10 py-8 space-y-12 border-t border-border">
            {showStats && (
              <Reveal>
                <StatsSection profile={profile} variant="compact" />
              </Reveal>
            )}

            {mainSections.map((s) => (
              <Reveal key={s.type}>
                <SectionRenderer
                  section={s}
                  profile={profile}
                  theme={theme}
                />
              </Reveal>
            ))}
          </div>

          {/* Booking embedded at bottom of card */}
          <div className="border-t border-border bg-secondary/40 px-6 sm:px-10 py-10">
            <Reveal>
              <BookingSection profile={profile} theme={theme} variant="embedded" />
            </Reveal>
          </div>
        </article>

        {profile.contact_email && (
          <p className="relative max-w-3xl mx-auto text-center text-xs text-muted-foreground mt-6">
            Direktan kontakt:{" "}
            <a
              href={`mailto:${profile.contact_email}`}
              className="text-foreground underline underline-offset-4"
            >
              {profile.contact_email}
            </a>
          </p>
        )}
      </main>

      <footer className="relative border-t border-border py-6 bg-background/60 backdrop-blur-md">
        <p className="max-w-3xl mx-auto px-6 text-center text-xs text-muted-foreground">
          Stranica generisana putem{" "}
          <span className="text-foreground font-medium">profesori.rs</span>
        </p>
      </footer>

      {profile.available_for_new_students && <StickyCta />}
      <QuickContactDock
        phone={profile.contact_phone}
        email={profile.contact_email}
      />
    </div>
  );
}

function SocialLinksRow({ links }: { links: SocialLink[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {links.map((l, i) => (
        <a
          key={i}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={SOCIAL_LINK_LABELS[l.type]}
          className="flex size-8 items-center justify-center rounded-full border border-border bg-background hover:bg-secondary transition-colors"
        >
          <SocialIcon type={l.type} className="size-3.5" />
        </a>
      ))}
    </div>
  );
}
