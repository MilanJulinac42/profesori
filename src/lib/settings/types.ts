export type OrgSettings = {
  /** Default price per lesson (paras) used when creating a new student. */
  default_price_per_lesson?: number;
  /** Default duration (minutes) used when creating a new student. */
  default_lesson_duration_minutes?: number;
  /** Whether to bill cancelled-by-student lessons. Default true. */
  charge_for_cancelled_by_student?: boolean;
  /** Whether to bill no-show lessons. Default true. */
  charge_for_no_show?: boolean;
  /** Custom reminder template with placeholders. Empty/undefined → use default. */
  reminder_template?: string;
  /** Whether to send automatic email reminders to parents. Default false. */
  send_automatic_reminders?: boolean;
};

export const DEFAULT_SETTINGS: OrgSettings = {
  default_price_per_lesson: 250000, // 2500 RSD
  default_lesson_duration_minutes: 60,
  charge_for_cancelled_by_student: true,
  charge_for_no_show: true,
  send_automatic_reminders: false,
};

/** Placeholders supported in custom reminder templates. */
export const TEMPLATE_PLACEHOLDERS = [
  { key: "{ime_ucenika}", desc: "Ime učenika" },
  { key: "{ime_roditelja}", desc: "Ime roditelja (ili Poštovani ako prazno)" },
  { key: "{iznos}", desc: "Iznos duga (npr. 7.500 RSD)" },
  { key: "{broj_casova}", desc: "Broj neplaćenih časova" },
  { key: "{najstariji_datum}", desc: "Datum najstarijeg neplaćenog časa" },
  { key: "{ime_profesora}", desc: "Tvoje ime" },
];

export const DEFAULT_REMINDER_TEMPLATE = `Poštovani {ime_roditelja},

Ovo je podsetnik za neizmireni dug za časove za učenika {ime_ucenika}.

Dug: {iznos}
{broj_casova} (najstariji od {najstariji_datum}).

Hvala unapred,
{ime_profesora}`;
