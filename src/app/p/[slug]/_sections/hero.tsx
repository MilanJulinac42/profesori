import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { SocialIcon } from "@/components/social-icon";
import {
  SOCIAL_LINK_LABELS,
  type PublicProfile,
  type SocialLink,
} from "@/lib/public-profile/types";
import type { ThemeDef } from "@/lib/public-profile/themes";
import { Avatar } from "../_shared/avatar";

export function HeroSection({
  profile,
  theme,
}: {
  profile: PublicProfile;
  theme: ThemeDef;
}) {
  return (
    <section className="relative overflow-hidden">
      {theme.heroBg && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: theme.heroBg }}
        />
      )}
      {theme.showGrid && (
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
      )}

      <div className="relative max-w-5xl mx-auto px-6 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 items-center sm:items-start">
          <div className="relative shrink-0">
            {theme.avatarRing && (
              <div
                className="absolute -inset-2 rounded-full opacity-50 blur-xl"
                style={{ background: theme.avatarRing }}
              />
            )}
            <Avatar
              name={profile.display_name}
              photoUrl={profile.photo_url}
              className="relative size-32 sm:size-40 text-4xl ring-4 ring-background shadow-2xl"
            />
          </div>

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
              {profile.location && (
                <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" strokeWidth={1.75} />
                  {profile.location}
                </p>
              )}
            </div>

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

            {profile.links.length > 0 && (
              <SocialLinksRow links={profile.links} />
            )}

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
  );
}

function SocialLinksRow({ links }: { links: SocialLink[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
      {links.map((l, i) => (
        <a
          key={i}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={SOCIAL_LINK_LABELS[l.type]}
          title={SOCIAL_LINK_LABELS[l.type]}
          className="flex size-9 items-center justify-center rounded-full border border-border bg-card hover:bg-secondary hover:border-foreground/30 transition-colors"
        >
          <SocialIcon type={l.type} className="size-4 text-foreground" />
        </a>
      ))}
    </div>
  );
}
