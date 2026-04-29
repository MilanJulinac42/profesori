export type SocialLinkType =
  | "website"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "youtube"
  | "tiktok"
  | "twitter"
  | "github"
  | "other";

export type SocialLink = { type: SocialLinkType; url: string };

export type Qualification = {
  title: string;
  institution: string;
  year?: string | null;
};

export type Experience = {
  title: string;
  organization: string;
  period?: string | null;
  description?: string | null;
};

export type Testimonial = {
  quote: string;
  author: string;
  relation?: string | null;
};

export type PricingPackage = {
  name: string;
  /** Optional session count — used for display + per-session math. */
  sessions?: number | null;
  /** Price in paras (1 RSD = 100 paras). */
  price: number;
  description?: string | null;
  highlighted: boolean;
};

export type FaqItem = { question: string; answer: string };

export type GalleryImage = { url: string; caption?: string | null };

/** Per-day office hours. Keys: "0".."6" (0=Sunday). Null = closed. */
export type OfficeHoursMap = Record<string, { start: number; end: number } | null>;

export type PublicProfile = {
  id: string;
  organization_id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  subjects: string[];
  levels: string[];
  specialties: string[];
  formats: string[];
  years_experience: string | null;
  price_range_text: string | null;
  available_for_new_students: boolean;
  contact_email: string | null;
  contact_phone: string | null;
  photo_url: string | null;
  published: boolean;
  links: SocialLink[];
  languages: string[];
  intro_video_url: string | null;
  qualifications: Qualification[];
  experiences: Experience[];
  testimonials: Testimonial[];
  location: string | null;
  theme: string;
  layout: string;
  sections: unknown;
  pricing_packages: PricingPackage[];
  faq_items: FaqItem[];
  gallery_images: GalleryImage[];
  intro_video_autoplay: boolean;
  office_hours: OfficeHoursMap | null;
  created_at: string;
  updated_at: string;
};

export const SOCIAL_LINK_LABELS: Record<SocialLinkType, string> = {
  website: "Web sajt",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  twitter: "X (Twitter)",
  github: "GitHub",
  other: "Drugo",
};

export const SOCIAL_LINK_OPTIONS: SocialLinkType[] = [
  "website",
  "linkedin",
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "twitter",
  "github",
  "other",
];

export const COMMON_SUBJECTS = [
  "Matematika",
  "Fizika",
  "Hemija",
  "Biologija",
  "Informatika",
  "Programiranje",
  "Srpski jezik",
  "Engleski jezik",
  "Nemački jezik",
  "Francuski jezik",
  "Italijanski jezik",
  "Ruski jezik",
  "Španski jezik",
  "Istorija",
  "Geografija",
  "Muzička kultura",
  "Likovno",
  "Ekonomija",
  "Statistika",
  "Filozofija",
];

export const COMMON_LEVELS = [
  "Niži razredi OŠ",
  "Viši razredi OŠ",
  "Gimnazija",
  "Srednja stručna škola",
  "Fakultet",
  "Odrasli",
  "Predškolski uzrast",
];

export const COMMON_SPECIALTIES = [
  "Priprema za malu maturu",
  "Priprema za veliku maturu",
  "Priprema za prijemni ispit",
  "Olimpijade i takmičenja",
  "Domaći zadaci",
  "Dopunska nastava",
  "Učenje sa decom sa smetnjama",
  "Cambridge",
  "IELTS",
  "TOEFL",
  "DELF",
  "DELE",
  "Goethe",
  "ECDL",
  "Razgovorne vežbe",
  "Poslovni jezik",
];

export const COMMON_FORMATS = [
  "Online (Zoom / Meet)",
  "Uživo kod profesora",
  "Profesor dolazi kući",
  "Hibridno",
  "Grupni časovi",
  "Individualni časovi",
];

export const COMMON_LANGUAGES = [
  "Srpski",
  "Engleski",
  "Nemački",
  "Francuski",
  "Italijanski",
  "Ruski",
  "Španski",
];

/** Best-effort YouTube ID extraction. Returns null if no match. */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const match = url.match(re);
    if (match) return match[1];
  }
  return null;
}
