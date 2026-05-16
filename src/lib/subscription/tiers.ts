/**
 * Subscription tier matrix.
 *
 * Single source of truth for "what each plan can do". hasAccess() looks at
 * this table; UI components and server actions call hasAccess() to decide
 * whether to surface a feature or block it.
 *
 * NOTE: this file defines the *intent*. Enforcement is currently advisory —
 * call sites use hasAccess() to render upgrade hints, not to actually block
 * actions. Real paywalls land alongside the trial-expiration flow.
 */

export const TIERS = ["start", "pro", "premium"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_LABELS: Record<Tier, string> = {
  start: "Start",
  pro: "Pro",
  premium: "Premium",
};

export const TIER_DESCRIPTIONS: Record<Tier, string> = {
  start: "Početni paket — sve što treba za prvih nekoliko učenika.",
  pro: "Za aktivne profesore sa punim rasporedom.",
  premium: "Sve, plus AI funkcije i automatika.",
};

/**
 * Every gateable feature. Add new keys here, then opt in per-tier below.
 * Keeping the list short on purpose — we don't want to litter the app with
 * conditional gates.
 */
export type Feature =
  | "ai_assistant"
  | "ai_voice_input"
  | "ai_exercises"
  | "ai_lesson_notes_transcription"
  | "automatic_reminders"
  | "automatic_reports"
  | "csv_import"
  | "bulk_schedule_actions"
  | "schedule_drag_drop"
  | "public_profile"
  | "parent_portal"
  | "google_calendar_sync"
  | "custom_reminder_template"
  | "custom_report_closing"
  | "unlimited_students";

export const FEATURE_LABELS: Record<Feature, string> = {
  ai_assistant: "AI asistent",
  ai_voice_input: "Glasovni unos za asistenta",
  ai_exercises: "AI generator zadataka",
  ai_lesson_notes_transcription: "AI transkripcija beleški časa",
  automatic_reminders: "Automatske opomene roditeljima",
  automatic_reports: "Automatski nedeljni i mesečni izveštaji",
  csv_import: "Uvoz učenika iz CSV-a",
  bulk_schedule_actions: "Grupne akcije nad rasporedom",
  schedule_drag_drop: "Pomeranje časa povlačenjem",
  public_profile: "Javni profil sa upitima",
  parent_portal: "Roditeljski portal",
  google_calendar_sync: "Google Calendar sinhronizacija",
  custom_reminder_template: "Custom šablon opomene",
  custom_report_closing: "Custom završnica izveštaja",
  unlimited_students: "Neograničen broj učenika",
};

/**
 * Per-tier soft caps. null = unlimited. hasAccess only checks boolean
 * features; numeric caps are read directly via getLimit(plan, "limit_name").
 */
type Caps = {
  max_students: number | null;
  max_assistant_messages_per_day: number | null;
};

type TierEntry = {
  features: Record<Feature, boolean>;
  caps: Caps;
};

export const TIER_MATRIX: Record<Tier, TierEntry> = {
  start: {
    features: {
      ai_assistant: true,
      ai_voice_input: false,
      ai_exercises: false,
      ai_lesson_notes_transcription: false,
      automatic_reminders: false,
      automatic_reports: false,
      csv_import: false,
      bulk_schedule_actions: false,
      schedule_drag_drop: true,
      public_profile: true,
      parent_portal: true,
      google_calendar_sync: false,
      custom_reminder_template: false,
      custom_report_closing: false,
      unlimited_students: false,
    },
    caps: {
      max_students: 5,
      max_assistant_messages_per_day: 20,
    },
  },
  pro: {
    features: {
      ai_assistant: true,
      ai_voice_input: true,
      ai_exercises: false,
      ai_lesson_notes_transcription: false,
      automatic_reminders: true,
      automatic_reports: true,
      csv_import: true,
      bulk_schedule_actions: true,
      schedule_drag_drop: true,
      public_profile: true,
      parent_portal: true,
      google_calendar_sync: true,
      custom_reminder_template: true,
      custom_report_closing: true,
      unlimited_students: true,
    },
    caps: {
      max_students: null,
      max_assistant_messages_per_day: 200,
    },
  },
  premium: {
    features: {
      ai_assistant: true,
      ai_voice_input: true,
      ai_exercises: true,
      ai_lesson_notes_transcription: true,
      automatic_reminders: true,
      automatic_reports: true,
      csv_import: true,
      bulk_schedule_actions: true,
      schedule_drag_drop: true,
      public_profile: true,
      parent_portal: true,
      google_calendar_sync: true,
      custom_reminder_template: true,
      custom_report_closing: true,
      unlimited_students: true,
    },
    caps: {
      max_students: null,
      max_assistant_messages_per_day: null,
    },
  },
};

/** Boolean check used at call sites and in UI to render upgrade hints. */
export function hasAccess(plan: Tier | string, feature: Feature): boolean {
  const tier = (TIERS as readonly string[]).includes(plan)
    ? (plan as Tier)
    : "start";
  return TIER_MATRIX[tier].features[feature] === true;
}

/** Returns the soft cap value for the given plan + key, or null if unlimited. */
export function getLimit(
  plan: Tier | string,
  key: keyof Caps,
): number | null {
  const tier = (TIERS as readonly string[]).includes(plan)
    ? (plan as Tier)
    : "start";
  return TIER_MATRIX[tier].caps[key];
}

/** Lowest tier that unlocks the given feature, or null if no tier has it. */
export function requiredTierFor(feature: Feature): Tier | null {
  for (const t of TIERS) {
    if (TIER_MATRIX[t].features[feature]) return t;
  }
  return null;
}
