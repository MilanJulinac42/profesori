"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import {
  getConnectionForUser,
  listUserCalendars,
  createProfesoriCalendar,
} from "./calendar";

export type CalendarOption = {
  id: string;
  summary: string;
  primary: boolean;
};

export async function listCalendarsAction(): Promise<
  | { ok: true; calendars: CalendarOption[] }
  | { ok: false; error: string }
> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();
    const conn = await getConnectionForUser(supabase, profile.id);
    if (!conn) return { ok: false, error: "Niste povezani sa Google-om." };
    const cals = await listUserCalendars(supabase, conn);
    return { ok: true, calendars: cals };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}

export async function selectCalendarAction(
  calendarId: string,
  calendarName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();
    const { error } = await supabase
      .from("google_connections")
      .update({ calendar_id: calendarId, calendar_name: calendarName })
      .eq("user_id", profile.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}

export async function createProfesoriCalendarAction(): Promise<
  | { ok: true; id: string; summary: string; reused: boolean }
  | { ok: false; error: string }
> {
  try {
    const { profile } = await requireUser();
    const supabase = await createClient();
    const conn = await getConnectionForUser(supabase, profile.id);
    if (!conn) return { ok: false, error: "Niste povezani sa Google-om." };

    // Check if "Profesori" calendar already exists — reuse umesto duplikata
    const existing = await listUserCalendars(supabase, conn);
    const matched = existing.find((c) =>
      c.summary.toLowerCase().includes("profesori"),
    );
    if (matched) {
      await supabase
        .from("google_connections")
        .update({ calendar_id: matched.id, calendar_name: matched.summary })
        .eq("user_id", profile.id);
      revalidatePath("/settings");
      return { ok: true, id: matched.id, summary: matched.summary, reused: true };
    }

    const cal = await createProfesoriCalendar(supabase, conn);
    await supabase
      .from("google_connections")
      .update({ calendar_id: cal.id, calendar_name: cal.summary })
      .eq("user_id", profile.id);
    revalidatePath("/settings");
    return { ok: true, id: cal.id, summary: cal.summary, reused: false };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Greška.",
    };
  }
}
