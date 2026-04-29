import type { PublicProfile } from "./types";

export type SectionType =
  | "stats"
  | "bio"
  | "video"
  | "tags"
  | "experience"
  | "qualifications"
  | "testimonials"
  | "direct_contact";

export type Section = {
  type: SectionType;
  visible: boolean;
};

/** Shown to the user in the editor list, with friendly label + description. */
export const SECTION_META: Record<
  SectionType,
  { label: string; description: string }
> = {
  stats: {
    label: "Statistike",
    description: "Brojevi: godine iskustva, predmeti, diplome, preporuke.",
  },
  bio: {
    label: "Biografija",
    description: "Kratak pull-quote tekst o tebi.",
  },
  video: {
    label: "Video predstavljanje",
    description: "YouTube embed.",
  },
  tags: {
    label: "Šta predajem",
    description: "Predmeti, nivoi, specijalnosti, formati, jezici.",
  },
  experience: {
    label: "Iskustvo",
    description: "Timeline poslova i pozicija.",
  },
  qualifications: {
    label: "Obrazovanje",
    description: "Diplome, sertifikati, kvalifikacije.",
  },
  testimonials: {
    label: "Preporuke",
    description: "Citati učenika i roditelja.",
  },
  direct_contact: {
    label: "Direktan email",
    description: "Mali link sa email adresom ispod booking forme.",
  },
};

/** All known section types in their default order. */
export const ALL_SECTION_TYPES: SectionType[] = [
  "stats",
  "bio",
  "video",
  "tags",
  "experience",
  "qualifications",
  "testimonials",
  "direct_contact",
];

export const DEFAULT_SECTIONS: Section[] = ALL_SECTION_TYPES.map((type) => ({
  type,
  visible: true,
}));

/**
 * Normalize a sections array — fills in any missing types at the end so old
 * profiles automatically get new sections when we add more types.
 */
export function normalizeSections(input: unknown): Section[] {
  const validTypes = new Set<SectionType>(ALL_SECTION_TYPES);
  const result: Section[] = [];
  const seen = new Set<SectionType>();

  if (Array.isArray(input)) {
    for (const item of input) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as { type?: unknown }).type === "string" &&
        validTypes.has((item as { type: SectionType }).type)
      ) {
        const t = (item as { type: SectionType }).type;
        if (seen.has(t)) continue;
        seen.add(t);
        const visible = (item as { visible?: unknown }).visible !== false;
        result.push({ type: t, visible });
      }
    }
  }

  // Append any missing types as visible defaults.
  for (const t of ALL_SECTION_TYPES) {
    if (!seen.has(t)) result.push({ type: t, visible: true });
  }

  return result;
}

/** Auto-hide rules: even if user marked a section visible, hide if no data. */
export function shouldRenderSection(
  type: SectionType,
  profile: PublicProfile,
): boolean {
  switch (type) {
    case "video":
      return Boolean(profile.intro_video_url);
    case "experience":
      return profile.experiences.length > 0;
    case "qualifications":
      return profile.qualifications.length > 0;
    case "testimonials":
      return profile.testimonials.length > 0;
    case "direct_contact":
      return Boolean(profile.contact_email);
    case "bio":
      return Boolean(profile.bio);
    case "stats":
      return true; // Always render — auto-derives from data, may show partial.
    case "tags":
      return (
        profile.subjects.length +
          profile.levels.length +
          profile.specialties.length +
          profile.formats.length +
          profile.languages.length >
        0
      );
  }
}
