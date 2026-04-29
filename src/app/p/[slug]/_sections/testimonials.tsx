import { MessageCircle, Quote } from "lucide-react";
import type {
  PublicProfile,
  Testimonial,
} from "@/lib/public-profile/types";
import type { ThemeDef } from "@/lib/public-profile/themes";
import { Avatar } from "../_shared/avatar";
import { Stars } from "../_shared/stars";

export function TestimonialsSection({
  profile,
  theme,
}: {
  profile: PublicProfile;
  theme: ThemeDef;
}) {
  if (profile.testimonials.length === 0) return null;
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-medium tracking-tight inline-flex items-center gap-2">
        <MessageCircle className="size-5" strokeWidth={1.75} />
        Šta kažu
      </h2>

      <FeaturedTestimonial
        t={profile.testimonials[0]}
        cardAccentBg={theme.cardAccentBg}
      />

      {profile.testimonials.length > 1 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {profile.testimonials.slice(1).map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedTestimonial({
  t,
  cardAccentBg,
}: {
  t: Testimonial;
  cardAccentBg: string;
}) {
  return (
    <figure className="relative overflow-hidden rounded-3xl border border-border bg-card p-7 sm:p-10">
      {cardAccentBg && (
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{ backgroundImage: cardAccentBg }}
        />
      )}
      <Quote
        className="absolute top-6 right-6 size-10 text-muted-foreground/15"
        strokeWidth={1.5}
      />
      <div className="relative space-y-5">
        <Stars />
        <blockquote className="text-xl sm:text-2xl leading-relaxed font-light tracking-tight pr-12">
          „{t.quote}"
        </blockquote>
        <figcaption className="flex items-center gap-3 pt-4 border-t border-border">
          <Avatar
            name={t.author}
            photoUrl={null}
            className="size-11 text-sm"
          />
          <div>
            <div className="text-sm font-medium">{t.author}</div>
            {t.relation && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {t.relation}
              </div>
            )}
          </div>
        </figcaption>
      </div>
    </figure>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <figure className="rounded-xl border border-border bg-card p-5 space-y-4 relative">
      <Quote
        className="absolute top-4 right-4 size-5 text-muted-foreground/20"
        strokeWidth={1.75}
      />
      <Stars size="sm" />
      <blockquote className="text-sm leading-relaxed pr-6">
        {t.quote}
      </blockquote>
      <figcaption className="flex items-center gap-2.5 pt-3 border-t border-border">
        <Avatar name={t.author} photoUrl={null} className="size-9 text-xs" />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{t.author}</div>
          {t.relation && (
            <div className="text-xs text-muted-foreground truncate">
              {t.relation}
            </div>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
