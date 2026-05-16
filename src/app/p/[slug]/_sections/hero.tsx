import {
  ArrowRight,
  MapPin,
  Sparkles,
  GraduationCap,
  Star,
} from "lucide-react";
import { SocialIcon } from "@/components/social-icon";
import {
  SOCIAL_LINK_LABELS,
  type PublicProfile,
  type SocialLink,
} from "@/lib/public-profile/types";
import type { ThemeDef } from "@/lib/public-profile/themes";
import { Avatar } from "../_shared/avatar";
import { MathGlyphs } from "../_shared/math-glyphs";

export function HeroSection({
  profile,
  theme,
}: {
  profile: PublicProfile;
  theme: ThemeDef;
}) {
  const featuredTestimonial = profile.testimonials.find(
    (t) => t.quote && t.quote.length > 0,
  );

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

      {/* Decorative math glyphs */}
      <MathGlyphs />

      {/* Soft top hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
      />

      <div className="relative max-w-5xl mx-auto px-6 py-20 sm:py-28">
        <div className="flex flex-col sm:flex-row gap-10 sm:gap-14 items-center sm:items-start">
          {/* Avatar with glow ring */}
          <div className="relative shrink-0">
            {theme.avatarRing && (
              <div
                aria-hidden
                className="absolute -inset-3 rounded-full opacity-60 blur-2xl animate-pulse"
                style={{ background: theme.avatarRing }}
              />
            )}
            <div
              aria-hidden
              className="absolute -inset-1.5 rounded-full opacity-50"
              style={{
                background:
                  theme.avatarRing ||
                  "conic-gradient(from 180deg, oklch(0.78 0.16 205 / 0.5), oklch(0.7 0.27 340 / 0.4), oklch(0.78 0.16 205 / 0.5))",
              }}
            />
            <Avatar
              name={profile.display_name}
              photoUrl={profile.photo_url}
              className="relative size-36 sm:size-44 text-5xl ring-[5px] ring-background shadow-[0_24px_64px_-16px_oklch(0_0_0/0.5)]"
              priority
              sizes="(max-width: 640px) 144px, 176px"
            />
          </div>

          <div className="flex-1 space-y-6 min-w-0 text-center sm:text-left">
            {/* Top accent line */}
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
                Privatni profesor
              </span>
              {profile.location && (
                <>
                  <span aria-hidden className="text-muted-foreground/40">·</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="size-3" strokeWidth={2} />
                    {profile.location}
                  </span>
                </>
              )}
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-5xl sm:text-7xl text-foreground tracking-tighter leading-[0.95]">
                {profile.display_name}
              </h1>
              {profile.years_experience && (
                <p className="text-base sm:text-lg text-muted-foreground/90 leading-relaxed max-w-xl">
                  {profile.years_experience}
                </p>
              )}
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {profile.available_for_new_students ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-4 py-1.5 text-sm font-semibold">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                  </span>
                  Prima nove učenike
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary border border-border/60 px-4 py-1.5 text-sm text-muted-foreground font-medium">
                  <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                  Trenutno ne prima nove
                </span>
              )}
              {profile.price_range_text && (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-4 py-1.5 text-sm font-semibold">
                  <Sparkles className="size-3.5" strokeWidth={2.25} />
                  {profile.price_range_text}
                </span>
              )}
              {profile.qualifications.length > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-1.5 text-sm text-foreground font-medium">
                  <GraduationCap className="size-3.5" strokeWidth={2} />
                  {profile.qualifications.length}{" "}
                  {profile.qualifications.length === 1
                    ? "kvalifikacija"
                    : "kvalifikacija"}
                </span>
              )}
            </div>

            {profile.links.length > 0 && (
              <SocialLinksRow links={profile.links} />
            )}

            {/* Featured testimonial mini-quote */}
            {featuredTestimonial && featuredTestimonial.quote && (
              <figure className="relative max-w-lg pt-1">
                <blockquote className="text-sm text-foreground/85 italic leading-relaxed border-l-2 border-foreground/30 pl-4">
                  „{featuredTestimonial.quote.slice(0, 140)}
                  {featuredTestimonial.quote.length > 140 ? "…" : ""}“
                </blockquote>
                {featuredTestimonial.author && (
                  <figcaption className="mt-2 pl-4 text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
                    <Star
                      className="size-3 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400"
                      strokeWidth={1.5}
                    />
                    <span>
                      — {featuredTestimonial.author}
                      {featuredTestimonial.relation
                        ? `, ${featuredTestimonial.relation}`
                        : ""}
                    </span>
                  </figcaption>
                )}
              </figure>
            )}

            {/* CTAs */}
            {profile.available_for_new_students && (
              <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <a
                  href="#booking"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-semibold hover:opacity-90 transition-all shadow-[0_8px_24px_-8px_oklch(0_0_0/0.4)]"
                >
                  Pošalji upit
                  <ArrowRight className="size-4" strokeWidth={2.25} />
                </a>
                <a
                  href="#bio"
                  className="inline-flex items-center gap-2 rounded-full bg-card/70 backdrop-blur-md border border-border px-5 py-3 text-sm font-medium hover:bg-card transition-colors"
                >
                  Saznaj više
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
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
      {links.map((l, i) => (
        <a
          key={i}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={SOCIAL_LINK_LABELS[l.type]}
          title={SOCIAL_LINK_LABELS[l.type]}
          className="flex size-10 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-sm hover:bg-card hover:border-foreground/40 hover:scale-105 transition-all"
        >
          <SocialIcon type={l.type} className="size-4 text-foreground" />
        </a>
      ))}
    </div>
  );
}
