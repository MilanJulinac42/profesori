import type { Section } from "@/lib/public-profile/sections";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<Section["type"], string> = {
  bio: "O meni",
  tags: "Šta predajem",
  pricing: "Cenovnik",
  experience: "Iskustvo",
  qualifications: "Obrazovanje",
  testimonials: "Preporuke",
  faq: "Pitanja",
  gallery: "Galerija",
  video: "Video",
  calendar: "Termini",
  direct_contact: "Kontakt",
  stats: "Brojke",
};

/**
 * Magazine-style section chapter header.
 *   01  ●  ŠTA PREDAJEM ────────────
 */
export function MagazineSectionHeader({
  index,
  type,
  className,
}: {
  index: number;
  type: Section["type"];
  className?: string;
}) {
  const num = String(index).padStart(2, "0");
  const label = SECTION_LABELS[type];

  return (
    <div
      className={cn(
        "flex items-baseline gap-3 sm:gap-4 mb-7 sm:mb-9",
        className,
      )}
    >
      <span className="font-display text-3xl sm:text-4xl text-foreground/30 tabular-nums leading-none">
        {num}
      </span>
      <span
        aria-hidden
        className="size-1 rounded-full bg-foreground/30 shrink-0 self-center"
      />
      <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] font-semibold text-muted-foreground whitespace-nowrap">
        {label}
      </span>
      <span
        aria-hidden
        className="flex-1 h-px bg-gradient-to-r from-foreground/15 via-foreground/5 to-transparent"
      />
    </div>
  );
}
