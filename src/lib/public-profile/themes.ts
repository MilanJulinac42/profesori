export type ThemeId =
  | "aurora"
  | "minimal"
  | "sage"
  | "sunrise"
  | "editorial";

export type ThemeDef = {
  id: ThemeId;
  name: string;
  description: string;
  /** CSS background-image string for picker preview swatch. */
  previewBg: string;
  /** Aurora gradient over the hero. Empty string = no decorative gradient. */
  heroBg: string;
  /** Subtle gradient inside booking + featured testimonial cards. */
  cardAccentBg: string;
  /** Conic-gradient ring around the avatar. Empty = no glow. */
  avatarRing: string;
  /** Whether to render serif headings. */
  serifHeadings: boolean;
  /** Whether to render the subtle grid behind hero (mostly for non-Aurora). */
  showGrid: boolean;
};

export const THEMES: Record<ThemeId, ThemeDef> = {
  aurora: {
    id: "aurora",
    name: "Aurora",
    description: "Topla, šarena. Default.",
    previewBg:
      "conic-gradient(from 180deg, oklch(0.85 0.16 70), oklch(0.7 0.18 145), oklch(0.7 0.18 250), oklch(0.85 0.16 70))",
    heroBg:
      "radial-gradient(ellipse 70% 90% at 100% 0%, oklch(0.85 0.16 70 / 0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 0% 50%, oklch(0.7 0.18 145 / 0.14) 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 50% 100%, oklch(0.7 0.18 250 / 0.12) 0%, transparent 60%)",
    cardAccentBg:
      "radial-gradient(ellipse 60% 80% at 100% 0%, oklch(0.85 0.16 70 / 0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 0% 100%, oklch(0.7 0.18 145 / 0.10) 0%, transparent 60%)",
    avatarRing:
      "conic-gradient(from 180deg, oklch(0.85 0.16 70 / 0.6), oklch(0.7 0.18 145 / 0.6), oklch(0.7 0.18 250 / 0.6), oklch(0.85 0.16 70 / 0.6))",
    serifHeadings: false,
    showGrid: true,
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Crno-belo. Profesionalno.",
    previewBg:
      "linear-gradient(135deg, oklch(1 0 0), oklch(0.93 0 0))",
    heroBg: "",
    cardAccentBg: "",
    avatarRing: "",
    serifHeadings: false,
    showGrid: true,
  },
  sage: {
    id: "sage",
    name: "Sage",
    description: "Smireno zeleno. Edukacija.",
    previewBg:
      "conic-gradient(from 180deg, oklch(0.78 0.13 145), oklch(0.65 0.18 160), oklch(0.85 0.10 130), oklch(0.78 0.13 145))",
    heroBg:
      "radial-gradient(ellipse 70% 90% at 100% 0%, oklch(0.78 0.16 145 / 0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 0% 50%, oklch(0.65 0.18 160 / 0.14) 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 50% 100%, oklch(0.85 0.10 130 / 0.10) 0%, transparent 60%)",
    cardAccentBg:
      "radial-gradient(ellipse 60% 80% at 100% 0%, oklch(0.78 0.16 145 / 0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 0% 100%, oklch(0.65 0.18 160 / 0.08) 0%, transparent 60%)",
    avatarRing:
      "conic-gradient(from 180deg, oklch(0.78 0.16 145 / 0.6), oklch(0.65 0.18 160 / 0.6), oklch(0.85 0.10 130 / 0.6), oklch(0.78 0.16 145 / 0.6))",
    serifHeadings: false,
    showGrid: true,
  },
  sunrise: {
    id: "sunrise",
    name: "Sunrise",
    description: "Toplo, kreativno.",
    previewBg:
      "conic-gradient(from 180deg, oklch(0.85 0.18 70), oklch(0.78 0.20 30), oklch(0.88 0.14 90), oklch(0.85 0.18 70))",
    heroBg:
      "radial-gradient(ellipse 70% 90% at 100% 0%, oklch(0.85 0.18 70 / 0.20) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 0% 50%, oklch(0.78 0.20 30 / 0.16) 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 50% 100%, oklch(0.88 0.14 90 / 0.12) 0%, transparent 60%)",
    cardAccentBg:
      "radial-gradient(ellipse 60% 80% at 100% 0%, oklch(0.85 0.18 70 / 0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 0% 100%, oklch(0.78 0.20 30 / 0.10) 0%, transparent 60%)",
    avatarRing:
      "conic-gradient(from 180deg, oklch(0.85 0.18 70 / 0.7), oklch(0.78 0.20 30 / 0.7), oklch(0.88 0.14 90 / 0.7), oklch(0.85 0.18 70 / 0.7))",
    serifHeadings: false,
    showGrid: true,
  },
  editorial: {
    id: "editorial",
    name: "Editorial",
    description: "Magazinski. Serif naslovi.",
    previewBg:
      "linear-gradient(135deg, oklch(0.97 0.005 80), oklch(0.92 0.01 80))",
    heroBg:
      "radial-gradient(ellipse 80% 80% at 50% 50%, oklch(0.97 0.005 80 / 0.5) 0%, transparent 70%)",
    cardAccentBg: "",
    avatarRing:
      "conic-gradient(from 180deg, oklch(0.7 0.005 80 / 0.3), oklch(0.5 0.005 80 / 0.3), oklch(0.7 0.005 80 / 0.3))",
    serifHeadings: true,
    showGrid: false,
  },
};

export const THEME_OPTIONS: ThemeId[] = [
  "aurora",
  "minimal",
  "sage",
  "sunrise",
  "editorial",
];
