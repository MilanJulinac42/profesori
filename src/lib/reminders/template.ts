import { formatRsd } from "@/lib/money";

export type ReminderContext = {
  teacherName: string;
  studentName: string;
  parentName?: string | null;
  debt: number; // paras
  unpaidLessonsCount: number;
  oldestUnpaidAt?: string | null;
};

export function generateReminderText(ctx: ReminderContext): string {
  const greeting = ctx.parentName
    ? `Poštovani ${ctx.parentName},`
    : "Poštovani,";

  const oldestStr = ctx.oldestUnpaidAt
    ? ` (najstariji od ${formatDateShort(ctx.oldestUnpaidAt)})`
    : "";

  const lessonsWord =
    ctx.unpaidLessonsCount === 1
      ? "neplaćen čas"
      : ctx.unpaidLessonsCount < 5
        ? "neplaćena časa"
        : "neplaćenih časova";

  return `${greeting}

Ovo je podsetnik za neizmireni dug za časove za učenika ${ctx.studentName}.

Dug: ${formatRsd(ctx.debt)}
${ctx.unpaidLessonsCount} ${lessonsWord}${oldestStr}.

Hvala unapred,
${ctx.teacherName}`;
}

function formatDateShort(iso: string): string {
  const dt = new Date(iso);
  return dt.toLocaleDateString("sr-Latn-RS", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
