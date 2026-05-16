/**
 * Hand-curated fake data for the public demo page. Numbers + names are
 * chosen to look realistic for a Belgrade math/physics tutor with ~6
 * regular students. All amounts are in paras (RSD * 100).
 */

export const DEMO_TEACHER_NAME = "Stefan Petrović";
export const DEMO_ORG_NAME = "Privatni časovi · matematika i fizika";

export const DEMO_PERIOD_LABEL = "Ovaj mesec";
export const DEMO_PERIOD_COMPARE_LABEL = "vs prošli mesec";

export const DEMO_STATS = {
  revenue: 187_500_00, // paras → 187 500 RSD
  previousRevenue: 165_000_00,
  held: 24,
  previousHeld: 21,
  scheduled: 8,
  cancelled: 2,
  cancellationRate: 7.7,
  previousCancellationRate: 11.1,
  totalLessonsTouched: 26,
  lostRevenue: 0,
  averageRevenuePerHeld: 7_812_50,
  projectedRevenue: 60_000_00,
};

export const DEMO_DEBTORS = [
  {
    full_name: "Marko Petrović",
    debt: 7_500_00,
    unpaidLessons: 2,
    avatarHue: "cyan" as const,
  },
  {
    full_name: "Ana Jovanović",
    debt: 5_000_00,
    unpaidLessons: 1,
    avatarHue: "magenta" as const,
  },
];

export const DEMO_TOP_STUDENTS = [
  { name: "Marko Petrović", revenue: 45_000_00, lessons: 6 },
  { name: "Ana Jovanović", revenue: 37_500_00, lessons: 5 },
  { name: "Luka Nikolić", revenue: 30_000_00, lessons: 4 },
  { name: "Mila Radović", revenue: 22_500_00, lessons: 3 },
  { name: "Petar Stanković", revenue: 15_000_00, lessons: 2 },
];

export const DEMO_UPCOMING = [
  { name: "Marko Petrović", at: "Sutra, 17:00", duration: 60 },
  { name: "Ana Jovanović", at: "Sutra, 18:30", duration: 45 },
  { name: "Luka Nikolić", at: "Čet, 17:00", duration: 60 },
  { name: "Mila Radović", at: "Pet, 16:00", duration: 60 },
  { name: "Petar Stanković", at: "Pet, 17:30", duration: 45 },
];

export const DEMO_PENDING = [
  {
    kind: "debt" as const,
    title: "7.500 RSD duga",
    detail: "2 učenika · najveći Marko Petrović",
    cta: "Naplati",
  },
  {
    kind: "notes" as const,
    title: "3 časova bez beleške",
    detail: "Najstariji: Ana Jovanović · 12. mar",
    cta: "Snimi belešku",
  },
  {
    kind: "homework" as const,
    title: "2 domaća za pregled",
    detail: "Marko Petrović · Kvadratne jednačine",
    cta: "Pregledaj",
  },
];

export const DEMO_RECENT_ACTIVITY = [
  {
    kind: "payment" as const,
    label: "Uplata primljena",
    detail: "Ana Jovanović · 12.500 RSD",
    when: "pre 2h",
  },
  {
    kind: "lesson_held" as const,
    label: "Čas održan",
    detail: "Marko Petrović",
    when: "juče",
  },
  {
    kind: "booking" as const,
    label: "Nov upit",
    detail: "Marija Đukić · fizika, 1. razred SŠ",
    when: "pre 2 dana",
  },
  {
    kind: "reminder" as const,
    label: "Opomena poslata",
    detail: "Petar Stanković · WhatsApp",
    when: "pre 3 dana",
  },
];

/** 12-month revenue trend (paras), Jan → Dec of "ova godina". */
export const DEMO_MONTHLY_REVENUE = [
  120_000_00, 140_000_00, 155_000_00, 145_000_00, 160_000_00, 170_000_00,
  90_000_00, 100_000_00, 175_000_00, 182_000_00, 187_500_00, 0,
];

export const DEMO_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Maj",
  "Jun",
  "Jul",
  "Avg",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];

export const DEMO_CANCELLATION_BREAKDOWN = [
  { label: "Otkazao učenik", value: 1 },
  { label: "Otkazao profesor", value: 1 },
  { label: "Nije se pojavio", value: 0 },
];
