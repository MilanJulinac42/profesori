import { formatRsd } from "@/lib/money";

export type ReminderContext = {
  teacherName: string;
  studentName: string;
  parentName?: string | null;
  debt: number; // paras
  unpaidLessonsCount: number;
  oldestUnpaidAt?: string | null;
};

/**
 * Generate the reminder text. If `customTemplate` is provided, placeholders
 * (e.g. {ime_ucenika}) are substituted; otherwise a sensible default is used.
 */
export function generateReminderText(
  ctx: ReminderContext,
  customTemplate?: string | null,
): string {
  if (customTemplate && customTemplate.trim()) {
    return applyPlaceholders(customTemplate, ctx);
  }

  const greeting = ctx.parentName
    ? `Poštovani ${ctx.parentName},`
    : "Poštovani,";

  const oldestStr = ctx.oldestUnpaidAt
    ? ` (najstariji od ${formatDateShort(ctx.oldestUnpaidAt)})`
    : "";

  const lessonsWord = pluralCasovi(ctx.unpaidLessonsCount);

  return `${greeting}

Ovo je podsetnik za neizmireni dug za časove za učenika ${ctx.studentName}.

Dug: ${formatRsd(ctx.debt)}
${ctx.unpaidLessonsCount} ${lessonsWord}${oldestStr}.

Hvala unapred,
${ctx.teacherName}`;
}

function applyPlaceholders(template: string, ctx: ReminderContext): string {
  const lessonsWord = pluralCasovi(ctx.unpaidLessonsCount);
  const map: Record<string, string> = {
    "{ime_ucenika}": ctx.studentName,
    "{ime_roditelja}": ctx.parentName ?? "Poštovani",
    "{iznos}": formatRsd(ctx.debt),
    "{broj_casova}": `${ctx.unpaidLessonsCount} ${lessonsWord}`,
    "{najstariji_datum}": ctx.oldestUnpaidAt
      ? formatDateShort(ctx.oldestUnpaidAt)
      : "",
    "{ime_profesora}": ctx.teacherName,
  };
  let result = template;
  for (const [key, val] of Object.entries(map)) {
    result = result.split(key).join(val);
  }
  return result;
}

function pluralCasovi(count: number): string {
  if (count === 1) return "neplaćen čas";
  if (count >= 2 && count <= 4) return "neplaćena časa";
  return "neplaćenih časova";
}

function formatDateShort(iso: string): string {
  const dt = new Date(iso);
  return dt.toLocaleDateString("sr-Latn-RS", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
