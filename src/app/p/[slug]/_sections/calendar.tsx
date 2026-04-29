import { CalendarDays } from "lucide-react";
import type { PublicProfile } from "@/lib/public-profile/types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildCalendar,
  CALENDAR_DAYS_AHEAD,
} from "@/lib/public-profile/availability";
import { CalendarWidget } from "../_components/calendar-widget";

export async function CalendarSection({ profile }: { profile: PublicProfile }) {
  const supabase = createAdminClient();
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + CALENDAR_DAYS_AHEAD);

  const { data } = await supabase
    .from("lessons")
    .select("scheduled_at, duration_minutes")
    .eq("organization_id", profile.organization_id)
    .eq("status", "scheduled")
    .is("deleted_at", null)
    .gte("scheduled_at", start.toISOString())
    .lt("scheduled_at", end.toISOString());

  const busyLessons =
    (data as { scheduled_at: string; duration_minutes: number }[] | null) ?? [];

  const days = buildCalendar({
    now,
    daysAhead: CALENDAR_DAYS_AHEAD,
    busyLessons,
    officeHours: profile.office_hours,
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium tracking-tight inline-flex items-center gap-2">
          <CalendarDays className="size-5" strokeWidth={1.75} />
          Kad sam slobodan
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Klikni slobodan termin ispod — automatski se popuni forma za upit.
        </p>
      </div>

      <CalendarWidget days={days} />

      <p className="text-xs text-muted-foreground">
        <span className="inline-block size-2 rounded-sm bg-emerald-500 mr-1.5 align-middle" />
        Slobodno
        <span className="mx-3 text-muted-foreground/50">·</span>
        <span className="inline-block size-2 rounded-sm bg-secondary border border-border mr-1.5 align-middle" />
        Zauzeto
      </p>
    </section>
  );
}
