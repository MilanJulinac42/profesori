import { MapPin, Sparkles } from "lucide-react";
import type { PublicProfile, SocialLink } from "@/lib/public-profile/types";
import { SOCIAL_LINK_LABELS } from "@/lib/public-profile/types";
import type { ThemeDef } from "@/lib/public-profile/themes";
import {
  normalizeSections,
  shouldRenderSection,
} from "@/lib/public-profile/sections";
import { SocialIcon } from "@/components/social-icon";

import { StickyCta } from "../_components/sticky-cta";
import { StatsSection } from "../_sections/stats";
import { BookingSection } from "../_sections/booking";
import { SectionRenderer } from "../_shared/section-renderer";
import { Avatar } from "../_shared/avatar";

/**
 * Magazine layout — editorial masthead, big serif name, centered banner.
 * Always uses serif headings (theme-editorial class), regardless of palette.
 */
export function MagazineLayout({
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
      s.type !== "stats" && s.visible && shouldRenderSection(s.type, profile),
  );

  const issueLine = `BR. ${new Date().getFullYear()}`;

  return (
    <div className="flex-1 flex flex-col bg-background theme-editorial">
      {/* Masthead header */}
      <header className="border-b-2 border-foreground bg-background sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center justify-between text-[11px] uppercase tracking-[0.25em]">
          <span className="font-medium">profesori.rs</span>
          <span className="text-muted-foreground italic normal-case tracking-normal">
            Privatni časovi
          </span>
          <a href="#booking" className="font-medium underline underline-offset-4">
            Pošalji upit
          </a>
        </div>
      </header>

      {/* Editorial banner */}
      <section className="relative border-b-2 border-foreground">
        {theme.heroBg && (
          <div
            className="absolute inset-0 pointer-events-none opacity-70"
            style={{ backgroundImage: theme.heroBg }}
          />
        )}
        <div className="relative max-w-4xl mx-auto px-6 py-14 sm:py-20 text-center space-y-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Profil · {issueLine}
          </p>

          <h1 className="text-5xl sm:text-7xl lg:text-[6rem] font-normal tracking-tight leading-[0.95]">
            {profile.display_name}
          </h1>

          {profile.years_experience && (
            <p className="text-lg sm:text-xl italic text-muted-foreground max-w-2xl mx-auto">
              {profile.years_experience}
            </p>
          )}

          {/* Avatar centered below */}
          <div className="flex justify-center pt-2">
            <div className="relative">
              {theme.avatarRing && (
                <div
                  className="absolute -inset-2 rounded-full opacity-40 blur-xl"
                  style={{ background: theme.avatarRing }}
                />
              )}
              <Avatar
                name={profile.display_name}
                photoUrl={profile.photo_url}
                className="relative size-28 sm:size-32 text-3xl ring-2 ring-foreground"
              />
            </div>
          </div>

          {/* Inline meta */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm pt-2">
            {profile.location && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-3.5" strokeWidth={1.75} />
                {profile.location}
              </span>
            )}
            {profile.price_range_text && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Sparkles className="size-3.5" strokeWidth={1.75} />
                {profile.price_range_text}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              {profile.available_for_new_students ? (
                <>
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Prima nove učenike
                  </span>
                </>
              ) : (
                <>
                  <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                  <span className="text-muted-foreground">
                    Trenutno ne prima nove
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Social links */}
          {profile.links.length > 0 && (
            <SocialLinksRow links={profile.links} />
          )}

          {profile.available_for_new_students && (
            <div className="pt-3">
              <a
                href="#booking"
                className="inline-flex items-center gap-2 border-b-2 border-foreground pb-1 text-sm uppercase tracking-[0.2em] hover:opacity-70 transition-opacity"
              >
                Pošalji upit ↓
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-14 sm:py-20 space-y-16">
        {showStats && <StatsSection profile={profile} variant="compact" />}

        {mainSections.map((s) => (
          <SectionRenderer
            key={s.type}
            section={s}
            profile={profile}
            theme={theme}
          />
        ))}

        <BookingSection profile={profile} theme={theme} />
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-foreground py-6">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-[11px] uppercase tracking-[0.25em]">
          <span>Profesori.rs</span>
          <span className="text-muted-foreground">© {new Date().getFullYear()}</span>
        </div>
      </footer>

      {profile.available_for_new_students && <StickyCta />}
    </div>
  );
}

function SocialLinksRow({ links }: { links: SocialLink[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
      {links.map((l, i) => (
        <a
          key={i}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={SOCIAL_LINK_LABELS[l.type]}
          className="flex size-9 items-center justify-center rounded-full border border-foreground/30 hover:bg-foreground hover:text-background transition-colors"
        >
          <SocialIcon type={l.type} className="size-4" />
        </a>
      ))}
    </div>
  );
}
