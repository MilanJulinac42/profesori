"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export type NotificationKind =
  | "booking_received"
  | "homework_submitted"
  | "report_sent";

export type NotificationItem = {
  id: string; // composite key like "booking-uuid" so React keys are unique
  kind: NotificationKind;
  title: string;
  detail: string;
  href: string;
  createdAt: string;
  unread: boolean;
};

const FEED_LIMIT = 12;
const EPOCH = "1970-01-01T00:00:00Z";

/**
 * Pull the user's "bell" feed and unread count. Derives notifications from
 * existing source tables (booking_requests, homework, report_logs) filtered
 * by user_notification_state.last_seen_at — no separate notifications table.
 */
export async function getNotificationFeed(): Promise<{
  unreadCount: number;
  items: NotificationItem[];
  lastSeenAt: string;
}> {
  const { profile, authUser } = await requireUser();
  const supabase = await createClient();
  const orgId = profile.organization_id;

  const { data: state } = await supabase
    .from("user_notification_state")
    .select("last_seen_at")
    .eq("user_id", authUser.id)
    .maybeSingle();
  const lastSeenAt =
    (state as { last_seen_at: string } | null)?.last_seen_at ?? EPOCH;

  const [bookingsRes, homeworkRes, reportsRes] = await Promise.all([
    supabase
      .from("booking_requests")
      .select("id, parent_name, subject, created_at")
      .eq("organization_id", orgId)
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(FEED_LIMIT),
    supabase
      .from("homework")
      .select(
        "id, title, submitted_at, student_id, students(full_name)",
      )
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .eq("status", "submitted")
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(FEED_LIMIT),
    supabase
      .from("report_logs")
      .select(
        "id, kind, subject, sent_at, student_id, students(full_name)",
      )
      .eq("organization_id", orgId)
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(FEED_LIMIT),
  ]);

  const items: NotificationItem[] = [];

  type B = {
    id: string;
    parent_name: string;
    subject: string | null;
    created_at: string;
  };
  for (const b of (bookingsRes.data ?? []) as B[]) {
    items.push({
      id: `booking-${b.id}`,
      kind: "booking_received",
      title: "Nov upit",
      detail: b.subject
        ? `${b.parent_name} · ${b.subject}`
        : b.parent_name,
      href: "/profile/inbox",
      createdAt: b.created_at,
      unread: b.created_at > lastSeenAt,
    });
  }

  type H = {
    id: string;
    title: string;
    submitted_at: string;
    student_id: string;
    students: { full_name: string } | { full_name: string }[] | null;
  };
  for (const h of (homeworkRes.data ?? []) as H[]) {
    const studentName = Array.isArray(h.students)
      ? h.students[0]?.full_name
      : h.students?.full_name;
    items.push({
      id: `homework-${h.id}`,
      kind: "homework_submitted",
      title: "Domaći predat",
      detail: `${studentName ?? "Učenik"} · ${h.title}`,
      href: `/students/${h.student_id}`,
      createdAt: h.submitted_at,
      unread: h.submitted_at > lastSeenAt,
    });
  }

  type R = {
    id: string;
    kind: "weekly" | "monthly";
    subject: string;
    sent_at: string;
    student_id: string;
    students: { full_name: string } | { full_name: string }[] | null;
  };
  for (const r of (reportsRes.data ?? []) as R[]) {
    const studentName = Array.isArray(r.students)
      ? r.students[0]?.full_name
      : r.students?.full_name;
    items.push({
      id: `report-${r.id}`,
      kind: "report_sent",
      title: r.kind === "weekly" ? "Nedeljni izveštaj poslat" : "Mesečni izveštaj poslat",
      detail: studentName ?? "—",
      href: `/reports/${r.id}`,
      createdAt: r.sent_at,
      unread: r.sent_at > lastSeenAt,
    });
  }

  // Merge + sort across all sources by createdAt desc, cap.
  items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const unreadCount = items.filter((i) => i.unread).length;

  return {
    unreadCount,
    items: items.slice(0, FEED_LIMIT),
    lastSeenAt,
  };
}

/** Stamp last_seen_at = now for the caller. */
export async function markNotificationsSeen(): Promise<{ ok: true }> {
  const { authUser } = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("user_notification_state")
    .upsert(
      {
        user_id: authUser.id,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  revalidatePath("/", "layout");
  return { ok: true };
}
