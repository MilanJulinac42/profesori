import { google, type calendar_v3 } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authorizedClient } from "./oauth";

export type GoogleConnection = {
  id: string;
  user_id: string;
  organization_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
  google_email: string | null;
  calendar_id: string;
  calendar_name: string | null;
  sync_token: string | null;
  last_synced_at: string | null;
  watch_channel_id: string | null;
  watch_resource_id: string | null;
  watch_expires_at: string | null;
};

/**
 * Učitava konekciju i osigurava da je access_token važeći (refresh-uje ako
 * je istekao). Nakon refresh-a perzistira nove tokene.
 */
export async function getCalendarClient(
  supabase: SupabaseClient,
  conn: GoogleConnection,
): Promise<calendar_v3.Calendar> {
  const expiresAt = new Date(conn.expires_at);
  const now = new Date();

  // Ako tek što je istekao ili istice u sledeće 2 minute, refresh
  let accessToken = conn.access_token;
  if (expiresAt.getTime() - now.getTime() < 2 * 60 * 1000) {
    const oauth2 = authorizedClient({
      access_token: conn.access_token,
      refresh_token: conn.refresh_token,
      expires_at: expiresAt,
    });
    const { credentials } = await oauth2.refreshAccessToken();
    accessToken = credentials.access_token!;
    const newExpiry = credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : new Date(Date.now() + 3500 * 1000);

    // Persistuj nove tokene
    await supabase
      .from("google_connections")
      .update({
        access_token: accessToken,
        expires_at: newExpiry.toISOString(),
        // refresh_token se obično ne menja, ali ako ga vrati, sačuvajmo
        ...(credentials.refresh_token
          ? { refresh_token: credentials.refresh_token }
          : {}),
      })
      .eq("id", conn.id);
  }

  const oauth2 = authorizedClient({
    access_token: accessToken,
    refresh_token: conn.refresh_token,
    expires_at: new Date(expiresAt.getTime()),
  });

  return google.calendar({ version: "v3", auth: oauth2 });
}

/** Listanje korisnikovih kalendara — za picker u settings UI. */
export async function listUserCalendars(
  supabase: SupabaseClient,
  conn: GoogleConnection,
): Promise<Array<{ id: string; summary: string; primary: boolean }>> {
  const calendar = await getCalendarClient(supabase, conn);
  const res = await calendar.calendarList.list({});
  return (res.data.items ?? [])
    .filter((c) => c.id && c.summary)
    .map((c) => ({
      id: c.id!,
      summary: c.summary!,
      primary: !!c.primary,
    }));
}

/** Kreiranje novog "Profesori" kalendara na korisnikovom Google nalogu. */
export async function createProfesoriCalendar(
  supabase: SupabaseClient,
  conn: GoogleConnection,
): Promise<{ id: string; summary: string }> {
  const calendar = await getCalendarClient(supabase, conn);
  const res = await calendar.calendars.insert({
    requestBody: {
      summary: "Profesori — privatni časovi",
      description:
        "Kalendar koji upravlja Profesori app — sadrži privatne časove sa učenicima.",
      timeZone: "Europe/Belgrade",
    },
  });
  return {
    id: res.data.id!,
    summary: res.data.summary!,
  };
}

/** Format lesson kao Google event (params + extendedProperties za reverse mapping). */
export function lessonToEventBody(input: {
  lessonId: string;
  studentName: string | null;
  scheduledAtIso: string;
  durationMinutes: number;
  status: string;
  notesAfterLesson?: string | null;
  topicsCovered?: string[] | null;
}): calendar_v3.Schema$Event {
  const start = new Date(input.scheduledAtIso);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);

  const summary = input.studentName
    ? `Čas — ${input.studentName}`
    : "Čas";

  const descParts: string[] = [];
  if (input.topicsCovered && input.topicsCovered.length > 0) {
    descParts.push(`Teme: ${input.topicsCovered.join(", ")}`);
  }
  if (input.notesAfterLesson) {
    descParts.push("", "Beleške:", input.notesAfterLesson);
  }
  descParts.push("", "— Kreirao Profesori app —");

  return {
    summary,
    description: descParts.join("\n"),
    start: { dateTime: start.toISOString(), timeZone: "Europe/Belgrade" },
    end: { dateTime: end.toISOString(), timeZone: "Europe/Belgrade" },
    status:
      input.status === "completed"
        ? "confirmed"
        : input.status.startsWith("cancelled") || input.status === "no_show"
          ? "cancelled"
          : "confirmed",
    extendedProperties: {
      private: {
        profesori_lesson_id: input.lessonId,
        profesori_status: input.status,
      },
    },
    reminders: {
      useDefault: true,
    },
  };
}

/** Kreira event na izabranom kalendaru. Vraća google_event_id. */
export async function pushLessonInsert(
  supabase: SupabaseClient,
  conn: GoogleConnection,
  body: calendar_v3.Schema$Event,
): Promise<string | null> {
  try {
    const calendar = await getCalendarClient(supabase, conn);
    const res = await calendar.events.insert({
      calendarId: conn.calendar_id,
      requestBody: body,
    });
    return res.data.id ?? null;
  } catch (err) {
    const e = err as {
      code?: number;
      message?: string;
      errors?: unknown;
      response?: { data?: unknown };
    };
    console.error(
      `[google] pushLessonInsert FAILED code=${e.code} msg=${e.message}`,
      e.errors ?? e.response?.data,
    );
    return null;
  }
}

export async function pushLessonUpdate(
  supabase: SupabaseClient,
  conn: GoogleConnection,
  eventId: string,
  body: calendar_v3.Schema$Event,
): Promise<boolean> {
  try {
    const calendar = await getCalendarClient(supabase, conn);
    await calendar.events.update({
      calendarId: conn.calendar_id,
      eventId,
      requestBody: body,
    });
    return true;
  } catch (err) {
    console.error("[google] pushLessonUpdate failed:", err);
    return false;
  }
}

export async function pushLessonDelete(
  supabase: SupabaseClient,
  conn: GoogleConnection,
  eventId: string,
): Promise<boolean> {
  try {
    const calendar = await getCalendarClient(supabase, conn);
    await calendar.events.delete({
      calendarId: conn.calendar_id,
      eventId,
    });
    return true;
  } catch (err) {
    // 404/410 means event already gone — treat as success
    const e = err as { code?: number };
    if (e.code === 404 || e.code === 410) return true;
    console.error("[google] pushLessonDelete failed:", err);
    return false;
  }
}

/** Pull-uje konekciju za trenutnog usera. Null ako nije povezan. */
export async function getConnectionForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<GoogleConnection | null> {
  const { data } = await supabase
    .from("google_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as GoogleConnection | null) ?? null;
}

/** Pull-uje konekciju po org_id (za sync nezavisno od request usera). */
export async function getConnectionForOrg(
  supabase: SupabaseClient,
  orgId: string,
): Promise<GoogleConnection | null> {
  const { data } = await supabase
    .from("google_connections")
    .select("*")
    .eq("organization_id", orgId)
    .maybeSingle();
  return (data as GoogleConnection | null) ?? null;
}
