import {
  ArrowRight,
  GraduationCap,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
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
import { StatsSection } from "../_sections/stats";
import { BookingSection } from "../_sections/booking";
import { SectionRenderer } from "../_shared/section-renderer";
import { Avatar } from "../_shared/avatar";

export function SplitLayout({
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
      // Direct email already shown in sidebar — don't duplicate.
      s.type !== "direct_contact" &&
      s.visible &&
      shouldRenderSection(s.type, profile),
  );

  return (
    <div
      className={cn(
        "flex-1 flex flex-col bg-background",
        theme.serifHeadings && "theme-editorial",
      )}
    >
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
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

      <div className="flex-1 lg:grid lg:grid-cols-[380px_1fr] max-w-7xl mx-auto w-full">
        <SidebarHero profile={profile} theme={theme} />

        <main className="px-6 py-10 lg:px-12 lg:py-14 space-y-14 min-w-0">
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
      </div>

      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Stranica generisana putem{" "}
            <span className="text-foreground font-medium">profesori.rs</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Privatni časovi · evidencija direktno između profesora i učenika
          </p>
        </div>
      </footer>

      {profile.available_for_new_students && <StickyCta />}
    </div>
  );
}

function SidebarHero({
  profile,
  theme,
}: {
  profile: PublicProfile;
  theme: ThemeDef;
}) {
  return (
    <aside className="relative lg:sticky lg:top-14 lg:self-start lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-border">
      {theme.heroBg && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: theme.heroBg }}
        />
      )}
      {theme.showGrid && (
        <div
          className="absolute inset-0 opacity-[0.3] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 50% 30%, black 30%, transparent 80%)",
          }}
        />
      )}

      <div className="relative px-6 py-10 lg:px-8 lg:py-12 space-y-6 text-center lg:text-left">
        {/* Avatar */}
        <div className="relative shrink-0 inline-block">
          {theme.avatarRing && (
            <div
              className="absolute -inset-2 rounded-full opacity-50 blur-xl"
              style={{ background: theme.avatarRing }}
            />
          )}
          <Avatar
            name={profile.display_name}
            photoUrl={profile.photo_url}
            className="relative size-32 sm:size-36 text-3xl ring-4 ring-background shadow-2xl"
          />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tighter leading-[1.05]">
            {profile.display_name}
          </h1>
          {profile.years_experience && (
            <p className="text-sm text-muted-foreground">
              {profile.years_experience}
            </p>
          )}
          {profile.location && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3" strokeWidth={1.75} />
              {profile.location}
            </p>
          )}
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5">
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

        {/* Social links */}
        {profile.links.length > 0 && (
          <SocialLinksRow links={profile.links} />
        )}

        {/* CTA */}
        {profile.available_for_new_students && (
          <a
            href="#booking"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity w-full lg:w-auto"
          >
            Pošalji upit
            <ArrowRight className="size-4" strokeWidth={2} />
          </a>
        )}

        {/* Direct contact email at bottom */}
        {profile.contact_email && (
          <div className="pt-4 border-t border-border">
            <a
              href={`mailto:${profile.contact_email}`}
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Mail className="size-3.5" strokeWidth={1.75} />
              {profile.contact_email}
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}

function SocialLinksRow({ links }: { links: SocialLink[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5">
      {links.map((l, i) => (
        <a
          key={i}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={SOCIAL_LINK_LABELS[l.type]}
          title={SOCIAL_LINK_LABELS[l.type]}
          className="flex size-8 items-center justify-center rounded-full border border-border bg-card hover:bg-secondary hover:border-foreground/30 transition-colors"
        >
          <SocialIcon type={l.type} className="size-3.5 text-foreground" />
        </a>
      ))}
    </div>
  );
}
