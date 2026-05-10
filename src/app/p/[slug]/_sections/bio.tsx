import type { PublicProfile } from "@/lib/public-profile/types";

export function BioSection({ profile }: { profile: PublicProfile }) {
  if (!profile.bio) return null;

  // Split first character to render as a drop cap.
  const firstChar = profile.bio.trimStart().charAt(0);
  const rest = profile.bio.trimStart().slice(1);

  return (
    <section id="bio" className="relative max-w-3xl scroll-mt-24">
      <p className="relative text-xl sm:text-2xl leading-relaxed font-light tracking-tight text-foreground/90">
        <span
          aria-hidden
          className="font-display float-left text-[5.5rem] sm:text-[6.5rem] leading-[0.85] mr-3 mt-1 text-brand"
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          {firstChar}
        </span>
        <span className="sr-only">{firstChar}</span>
        {rest}
      </p>
      <div className="flex justify-center pt-12 clear-both">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </section>
  );
}
