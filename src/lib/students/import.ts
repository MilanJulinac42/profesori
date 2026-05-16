import { normalizeHeader } from "@/lib/csv";

/** Fields we accept in a CSV import. Keys match what server expects. */
export type ImportFieldKey =
  | "full_name"
  | "grade"
  | "parent_name"
  | "parent_phone"
  | "parent_email"
  | "student_email"
  | "default_price_per_lesson"
  | "default_lesson_duration_minutes"
  | "notes"
  | "tags";

export type FieldSpec = {
  key: ImportFieldKey;
  label: string;
  /** Heuristic synonyms used for header auto-detection. All normalized. */
  synonyms: string[];
  required?: boolean;
};

export const IMPORT_FIELDS: FieldSpec[] = [
  {
    key: "full_name",
    label: "Ime i prezime",
    required: true,
    synonyms: [
      "ime",
      "imeprezime",
      "imeucenika",
      "ucenik",
      "name",
      "fullname",
      "student",
    ],
  },
  {
    key: "grade",
    label: "Razred",
    synonyms: ["razred", "klasa", "grade", "godina"],
  },
  {
    key: "parent_name",
    label: "Ime roditelja",
    synonyms: ["roditelj", "roditeljime", "imeroditelja", "parent", "parentname"],
  },
  {
    key: "parent_phone",
    label: "Telefon roditelja",
    synonyms: [
      "telefon",
      "tel",
      "phone",
      "roditeljtelefon",
      "parentphone",
      "kontakt",
      "mobilni",
    ],
  },
  {
    key: "parent_email",
    label: "Email roditelja",
    synonyms: ["email", "mail", "parentemail", "roditeljemail"],
  },
  {
    key: "student_email",
    label: "Email učenika",
    synonyms: ["emailucenika", "studentemail"],
  },
  {
    key: "default_price_per_lesson",
    label: "Cena po času (RSD)",
    synonyms: ["cena", "cenapocasu", "price", "rsd", "iznos"],
  },
  {
    key: "default_lesson_duration_minutes",
    label: "Trajanje časa (min)",
    synonyms: ["trajanje", "minuti", "duration", "vreme", "lengthmin"],
  },
  {
    key: "notes",
    label: "Beleška",
    synonyms: ["beleska", "napomena", "notes", "komentar", "note"],
  },
  {
    key: "tags",
    label: "Tagovi (zarezima)",
    synonyms: ["tag", "tagovi", "tags", "labela", "labele"],
  },
];

/** Per-header → field mapping (null = skip column). */
export type ColumnMapping = Record<number, ImportFieldKey | null>;

/**
 * Best-guess mapping of CSV headers → fields, using normalized synonym match.
 * Each field can be assigned to at most one column; first match wins.
 */
export function autoMap(headers: string[]): ColumnMapping {
  const result: ColumnMapping = {};
  const usedFields = new Set<ImportFieldKey>();

  for (let i = 0; i < headers.length; i++) {
    const norm = normalizeHeader(headers[i]);
    if (!norm) {
      result[i] = null;
      continue;
    }
    const match = IMPORT_FIELDS.find(
      (f) => !usedFields.has(f.key) && f.synonyms.includes(norm),
    );
    if (match) {
      result[i] = match.key;
      usedFields.add(match.key);
    } else {
      result[i] = null;
    }
  }
  return result;
}

/** Normalized row ready for DB insert. */
export type ImportRow = {
  full_name: string;
  grade: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  student_email: string | null;
  default_price_per_lesson: number; // paras
  default_lesson_duration_minutes: number;
  notes: string | null;
  tags: string[];
};

export type ValidatedRow =
  | { ok: true; row: ImportRow; lineNumber: number }
  | { ok: false; lineNumber: number; error: string };

/**
 * Validate + normalize a CSV row given a column mapping. lineNumber is the
 * 1-based row index in the source file (excluding header) — used in errors.
 */
export function validateRow(
  cells: string[],
  mapping: ColumnMapping,
  lineNumber: number,
): ValidatedRow {
  // Collapse cells by mapping into a partial record.
  const data: Partial<Record<ImportFieldKey, string>> = {};
  for (const [idxStr, field] of Object.entries(mapping)) {
    if (!field) continue;
    const idx = Number(idxStr);
    const raw = cells[idx]?.trim() ?? "";
    if (raw) data[field] = raw;
  }

  const fullName = data.full_name;
  if (!fullName) {
    return {
      ok: false,
      lineNumber,
      error: "Nedostaje ime učenika.",
    };
  }

  // Numbers.
  let pricePara = 0;
  if (data.default_price_per_lesson) {
    // Allow "3000", "3000.00", "3 000", "3,000", "3.000,00" — basic strip.
    const cleaned = data.default_price_per_lesson
      .replace(/[^\d,.\-]/g, "")
      .replace(/\.(?=\d{3}\b)/g, "") // remove thousands dots
      .replace(",", ".");
    const n = Number(cleaned);
    if (!Number.isFinite(n) || n < 0) {
      return {
        ok: false,
        lineNumber,
        error: `Neispravna cena: "${data.default_price_per_lesson}"`,
      };
    }
    pricePara = Math.round(n * 100);
  }

  let duration = 60;
  if (data.default_lesson_duration_minutes) {
    const n = Number(data.default_lesson_duration_minutes.replace(/[^\d]/g, ""));
    if (!Number.isFinite(n) || n <= 0 || n > 480) {
      return {
        ok: false,
        lineNumber,
        error: `Neispravno trajanje: "${data.default_lesson_duration_minutes}"`,
      };
    }
    duration = Math.round(n);
  }

  const tags = data.tags
    ? data.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return {
    ok: true,
    lineNumber,
    row: {
      full_name: fullName,
      grade: data.grade ?? null,
      parent_name: data.parent_name ?? null,
      parent_phone: data.parent_phone ?? null,
      parent_email: data.parent_email ?? null,
      student_email: data.student_email ?? null,
      default_price_per_lesson: pricePara,
      default_lesson_duration_minutes: duration,
      notes: data.notes ?? null,
      tags,
    },
  };
}
