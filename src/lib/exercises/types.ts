export type Difficulty = "lako" | "srednje" | "tesko" | "mesano";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  lako: "Lako",
  srednje: "Srednje",
  tesko: "Teško",
  mesano: "Mešano",
};

export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "lako", label: "Lako" },
  { value: "srednje", label: "Srednje" },
  { value: "tesko", label: "Teško" },
  { value: "mesano", label: "Mešano" },
];

export const COUNT_OPTIONS = [5, 10, 15, 20] as const;

/** Predefinisani razredi koje profesor može da bira. Pored ovih, može i slobodan unos. */
export const GRADE_PRESETS = [
  "5. razred OŠ",
  "6. razred OŠ",
  "7. razred OŠ",
  "8. razred OŠ",
  "1. razred SŠ",
  "2. razred SŠ",
  "3. razred SŠ",
  "4. razred SŠ",
  "Matura / prijemni",
];

export type Exercise = {
  question: string;
  solution: string;
  explanation: string;
};

export type ExerciseSet = {
  id: string;
  organization_id: string;
  title: string;
  subject: "matematika";
  grade_level: string;
  topic: string;
  difficulty: Difficulty;
  count: number;
  teacher_notes: string | null;
  prompt_used: string | null;
  exercises: Exercise[];
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ExerciseSetSummary = Pick<
  ExerciseSet,
  | "id"
  | "title"
  | "subject"
  | "grade_level"
  | "topic"
  | "difficulty"
  | "count"
  | "created_at"
>;
