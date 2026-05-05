import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  addDays,
} from "date-fns";
import { sr } from "date-fns/locale";
import type { ReportKind } from "./types";

/**
 * Vraća period za izveštaj. Default ankor je "ova nedelja/mesec",
 * ali može da se override-uje (npr. za mesečni izveštaj na dan 5. u mesecu
 * obično šaljemo izveštaj za PROŠLI mesec).
 */
export function getReportPeriod(
  kind: ReportKind,
  anchor: Date = new Date(),
): { start: Date; end: Date; label: string } {
  if (kind === "weekly") {
    const start = startOfWeek(anchor, { weekStartsOn: 1 }); // ponedeljak
    const end = addDays(endOfWeek(anchor, { weekStartsOn: 1 }), 0); // nedelja
    const label = formatWeekLabel(start, end);
    return { start, end, label };
  }

  // monthly
  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);
  const label = format(start, "LLLL yyyy.", { locale: sr });
  return { start, end, label };
}

/**
 * Past period — npr. izveštaj za PROŠLU nedelju (poslat u ponedeljak ujutru).
 */
export function getPastReportPeriod(
  kind: ReportKind,
  anchor: Date = new Date(),
): { start: Date; end: Date; label: string } {
  if (kind === "weekly") {
    const lastWeekAnchor = addDays(anchor, -7);
    return getReportPeriod("weekly", lastWeekAnchor);
  }
  // Past month: ankor je 1. ovog meseca, oduzmemo 1 dan da padne u prošli mesec.
  const lastMonthAnchor = addDays(startOfMonth(anchor), -1);
  return getReportPeriod("monthly", lastMonthAnchor);
}

function formatWeekLabel(start: Date, end: Date): string {
  // "5–11. maj 2026." ili "30. apr — 6. maj 2026." kad nedelja preseca mesec.
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${format(start, "d", { locale: sr })}–${format(end, "d. LLLL yyyy.", { locale: sr })}`;
  }
  return `${format(start, "d. LLL", { locale: sr })} — ${format(end, "d. LLL yyyy.", { locale: sr })}`;
}
