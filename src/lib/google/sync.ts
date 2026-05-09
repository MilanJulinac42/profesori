/**
 * Sync helperi — pozivaju se posle svake lesson mutacije.
 * Fire-and-forget — ako Google API padne, lokalna akcija ne pada;
 * google_synced_at ostaje null pa se može retry-ovati kasnije.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getConnectionForOrg,
  lessonToEventBody,
  pushLessonInsert,
  pushLessonUpdate,
  pushLessonDelete,
} from "./calendar";

/**
 * Sync-uje JEDAN lesson sa Google Calendar-om — insert, update, ili
 * delete u zavisnosti od stanja.
 *
 * - Ako lesson nema google_event_id i status=scheduled/completed → insert
 * - Ako ima i menjao se → update (Google razume status='cancelled' za otkazan)
 * - Ako je soft-deleted → delete event
 *
 * NE blokira pozivajuću akciju — error-i se loguju u console.
 */
export async function syncLessonAfterChange(
  supabase: SupabaseClient,
  organizationId: string,
  lessonId: string,
  options: { wasDeleted?: boolean } = {},
): Promise<void> {
  try {
    const conn = await getConnectionForOrg(supabase, organizationId);
    if (!conn) {
      console.log(
        `[google sync] no connection for org ${organizationId}, skipping`,
      );
      return;
    }
    console.log(
      `[google sync] starting lesson=${lessonId} calendar=${conn.calendar_id} deleted=${options.wasDeleted ?? false}`,
    );

    // Pull lesson
    const { data: lesson } = await supabase
      .from("lessons")
      .select(
        "id, organization_id, student_id, scheduled_at, duration_minutes, status, notes_after_lesson, topics_covered, google_event_id, deleted_at, students(full_name)",
      )
      .eq("id", lessonId)
      .maybeSingle();

    if (!lesson) return;
    const l = lesson as unknown as {
      id: string;
      organization_id: string;
      student_id: string;
      scheduled_at: string;
      duration_minutes: number;
      status: string;
      notes_after_lesson: string | null;
      topics_covered: string[] | null;
      google_event_id: string | null;
      deleted_at: string | null;
      students: { full_name: string } | null;
    };

    // DELETE case
    if (options.wasDeleted || l.deleted_at) {
      if (l.google_event_id) {
        const ok = await pushLessonDelete(supabase, conn, l.google_event_id);
        if (ok) {
          await supabase
            .from("lessons")
            .update({ google_event_id: null, google_synced_at: new Date().toISOString() })
            .eq("id", lessonId);
        }
      }
      return;
    }

    const body = lessonToEventBody({
      lessonId: l.id,
      studentName: l.students?.full_name ?? null,
      scheduledAtIso: l.scheduled_at,
      durationMinutes: l.duration_minutes,
      status: l.status,
      notesAfterLesson: l.notes_after_lesson,
      topicsCovered: l.topics_covered,
    });

    if (l.google_event_id) {
      // UPDATE existing event
      const ok = await pushLessonUpdate(supabase, conn, l.google_event_id, body);
      console.log(`[google sync] update result: ${ok}`);
      if (ok) {
        await supabase
          .from("lessons")
          .update({ google_synced_at: new Date().toISOString() })
          .eq("id", lessonId);
      }
    } else {
      // INSERT new event
      const eventId = await pushLessonInsert(supabase, conn, body);
      console.log(`[google sync] insert result: eventId=${eventId}`);
      if (eventId) {
        await supabase
          .from("lessons")
          .update({
            google_event_id: eventId,
            google_synced_at: new Date().toISOString(),
          })
          .eq("id", lessonId);
      }
    }
  } catch (err) {
    console.error("[google] syncLessonAfterChange failed:", err);
  }
}

/** Helper koji pri manuelnom "Sync sve" pull-uje sve nesinhrone časove. */
export async function backfillLessonsToGoogle(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<{ synced: number; failed: number }> {
  const conn = await getConnectionForOrg(supabase, organizationId);
  if (!conn) return { synced: 0, failed: 0 };

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .is("google_event_id", null)
    .gte("scheduled_at", new Date(Date.now() - 90 * 86400_000).toISOString())
    .limit(200);

  let synced = 0;
  let failed = 0;
  for (const l of lessons ?? []) {
    const before = await supabase
      .from("lessons")
      .select("google_event_id")
      .eq("id", l.id as string)
      .maybeSingle();
    await syncLessonAfterChange(supabase, organizationId, l.id as string);
    const after = await supabase
      .from("lessons")
      .select("google_event_id")
      .eq("id", l.id as string)
      .maybeSingle();
    if (after.data?.google_event_id && !before.data?.google_event_id) synced++;
    else failed++;
  }
  return { synced, failed };
}
