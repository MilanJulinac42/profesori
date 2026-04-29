import type { OfficeHoursMap } from "./types";

/** Default office hours used when teacher hasn't configured their own. */
export const DEFAULT_OFFICE_HOURS: Record<
  string,
  { start: number; end: number } | null
> = {
  "0": null,
  "1": { start: 16, end: 21 },
  "2": { start: 16, end: 21 },
  "3": { start: 16, end: 21 },
  "4": { start: 16, end: 21 },
  "5": { start: 16, end: 21 },
  "6": { start: 10, end: 18 },
};

export const SLOT_DURATION_MINUTES = 60;
export const CALENDAR_DAYS_AHEAD = 7;

export type Slot = {
  time: string;
  isoStart: string;
  busy: boolean;
  past: boolean;
};

export type CalendarDay = {
  date: string;
  weekdayShort: string;
  dayNum: string;
  monthShort: string;
  isToday: boolean;
  slots: Slot[];
  closed: boolean;
};

export function buildCalendar({
  now,
  daysAhead,
  busyLessons,
  officeHours,
}: {
  now: Date;
  daysAhead: number;
  busyLessons: { scheduled_at: string; duration_minutes: number }[];
  officeHours?: OfficeHoursMap | null;
}): CalendarDay[] {
  const hoursMap = officeHours ?? DEFAULT_OFFICE_HOURS;
  const days: CalendarDay[] = [];
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dow = String(date.getDay());
    const hours = hoursMap[dow];

    const dateISO = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const weekdayShort = date.toLocaleDateString("sr-Latn-RS", {
      weekday: "short",
    });
    const dayNum = String(date.getDate());
    const monthShort = date.toLocaleDateString("sr-Latn-RS", { month: "short" });
    const isToday = i === 0;

    if (!hours) {
      days.push({
        date: dateISO,
        weekdayShort,
        dayNum,
        monthShort,
        isToday,
        slots: [],
        closed: true,
      });
      continue;
    }

    const slots: Slot[] = [];
    for (let h = hours.start; h + 1 <= hours.end; h++) {
      const slotStart = new Date(date);
      slotStart.setHours(h, 0, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60_000);
      const past = slotStart < now;

      const busy = busyLessons.some((l) => {
        const lStart = new Date(l.scheduled_at);
        const lEnd = new Date(lStart.getTime() + l.duration_minutes * 60_000);
        return lStart < slotEnd && slotStart < lEnd;
      });

      slots.push({
        time: `${String(h).padStart(2, "0")}:00`,
        isoStart: slotStart.toISOString(),
        busy,
        past,
      });
    }

    days.push({
      date: dateISO,
      weekdayShort,
      dayNum,
      monthShort,
      isToday,
      slots,
      closed: false,
    });
  }

  return days;
}
