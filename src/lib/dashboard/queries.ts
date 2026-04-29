import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicProfile } from "@/lib/public-profile/types";

/* ---------------- Profile completeness ---------------- */

export type CompletenessCheck = {
  key: string;
  label: string;
  filled: boolean;
};

export type CompletenessResult = {
  score: number;
  filled: number;
  total: number;
  checks: CompletenessCheck[];
  missing: string[];
};

/** Score how complete the public profile is. Used by the dashboard widget. */
export function computeProfileCompleteness(
  profile: PublicProfile | null,
): CompletenessResult {
  if (!profile) {
    return { score: 0, filled: 0, total: 0, checks: [], missing: [] };
  }

  const checks: CompletenessCheck[] = [
    { key: "bio", label: "Biografija", filled: Boolean(profile.bio?.trim()) },
    { key: "photo", label: "Fotografija", filled: Boolean(profile.photo_url) },
    {
      key: "subjects",
      label: "Predmeti",
      filled: profile.subjects.length > 0,
    },
    { key: "levels", label: "Nivoi", filled: profile.levels.length > 0 },
    {
      key: "experience",
      label: "Iskustvo",
      filled: profile.experiences.length > 0,
    },
    {
      key: "qualifications",
      label: "Diplome",
      filled: profile.qualifications.length > 0,
    },
    {
      key: "testimonials",
      label: "Preporuke",
      filled: profile.testimonials.length > 0,
    },
    {
      key: "gallery",
      label: "Galerija",
      filled: (profile.gallery_images?.length ?? 0) > 0,
    },
    {
      key: "faq",
      label: "FAQ",
      filled: (profile.faq_items?.length ?? 0) > 0,
    },
    {
      key: "pricing",
      label: "Cenovnik",
      filled: (profile.pricing_packages?.length ?? 0) > 0,
    },
    {
      key: "video",
      label: "Video",
      filled: Boolean(profile.intro_video_url),
    },
    {
      key: "links",
      label: "Linkovi",
      filled: profile.links.length > 0,
    },
  ];

  const filled = checks.filter((c) => c.filled).length;
  const total = checks.length;
  const missing = checks.filter((c) => !c.filled).map((c) => c.label);

  return {
    score: total > 0 ? Math.round((filled / total) * 100) : 0,
    filled,
    total,
    checks,
    missing,
  };
}

/* ---------------- Recent activity ---------------- */

export type ActivityType =
  | "student_added"
  | "lesson_held"
  | "lesson_cancelled"
  | "payment_recorded"
  | "booking_received"
  | "reminder_sent";

export type ActivityEvent = {
  id: string;
  type: ActivityType;
  title: string;
  detail?: string;
  amount?: number; // paras, optional
  timestamp: string;
  href?: string;
};

/** Returns merged activity stream from students/lessons/payments/bookings/reminders. */
export async function getRecentActivity(
  supabase: SupabaseClient,
  limit = 10,
): Promise<ActivityEvent[]> {
  const [
    { data: students },
    { data: lessons },
    { data: payments },
    { data: bookings },
    { data: reminders },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("lessons")
      .select(
        "id, status, scheduled_at, updated_at, students(id, full_name)",
      )
      .is("deleted_at", null)
      .in("status", [
        "completed",
        "cancelled_by_student",
        "cancelled_by_teacher",
        "no_show",
      ])
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("payments")
      .select("id, amount, paid_at, students(id, full_name)")
      .is("deleted_at", null)
      .order("paid_at", { ascending: false })
      .limit(limit),
    supabase
      .from("booking_requests")
      .select("id, parent_name, subject, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("reminder_logs")
      .select(
        "id, channel, sent_at, students(id, full_name), amount_at_send",
      )
      .order("sent_at", { ascending: false })
      .limit(limit),
  ]);

  const events: ActivityEvent[] = [];

  type S = {
    id: string;
    full_name: string;
    created_at: string;
  };
  for (const s of (students as S[] | null) ?? []) {
    events.push({
      id: "s-" + s.id,
      type: "student_added",
      title: "Dodat učenik",
      detail: s.full_name,
      timestamp: s.created_at,
      href: `/students/${s.id}`,
    });
  }

  type L = {
    id: string;
    status: string;
    scheduled_at: string;
    updated_at: string;
    students: { id: string; full_name: string } | null;
  };
  for (const l of (lessons as L[] | null) ?? []) {
    const studentName = l.students?.full_name ?? "učenik";
    if (l.status === "completed") {
      events.push({
        id: "l-" + l.id,
        type: "lesson_held",
        title: "Čas održan",
        detail: studentName,
        timestamp: l.updated_at,
        href: l.students ? `/students/${l.students.id}` : undefined,
      });
    } else {
      events.push({
        id: "l-" + l.id,
        type: "lesson_cancelled",
        title:
          l.status === "no_show"
            ? "Učenik se nije pojavio"
            : l.status === "cancelled_by_student"
              ? "Učenik otkazao"
              : "Otkazan čas",
        detail: studentName,
        timestamp: l.updated_at,
        href: l.students ? `/students/${l.students.id}` : undefined,
      });
    }
  }

  type P = {
    id: string;
    amount: number;
    paid_at: string;
    students: { id: string; full_name: string } | null;
  };
  for (const p of (payments as P[] | null) ?? []) {
    events.push({
      id: "p-" + p.id,
      type: "payment_recorded",
      title: "Uplata primljena",
      detail: p.students?.full_name,
      amount: p.amount,
      timestamp: p.paid_at,
      href: p.students ? `/students/${p.students.id}` : undefined,
    });
  }

  type B = {
    id: string;
    parent_name: string;
    subject: string | null;
    created_at: string;
  };
  for (const b of (bookings as B[] | null) ?? []) {
    events.push({
      id: "b-" + b.id,
      type: "booking_received",
      title: "Novi upit",
      detail: b.subject ? `${b.parent_name} · ${b.subject}` : b.parent_name,
      timestamp: b.created_at,
      href: "/profile/inbox",
    });
  }

  type R = {
    id: string;
    channel: string;
    sent_at: string;
    amount_at_send: number;
    students: { id: string; full_name: string } | null;
  };
  for (const r of (reminders as R[] | null) ?? []) {
    events.push({
      id: "r-" + r.id,
      type: "reminder_sent",
      title: "Opomena poslata",
      detail: r.students?.full_name,
      timestamp: r.sent_at,
      href: r.students ? `/students/${r.students.id}` : undefined,
    });
  }

  return events
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, limit);
}

/* ---------------- New bookings preview ---------------- */

export type RecentBooking = {
  id: string;
  parent_name: string;
  parent_phone: string | null;
  parent_email: string | null;
  subject: string | null;
  student_grade: string | null;
  message: string | null;
  created_at: string;
  status: string;
};

export async function getRecentNewBookings(
  supabase: SupabaseClient,
  limit = 4,
): Promise<RecentBooking[]> {
  const { data } = await supabase
    .from("booking_requests")
    .select(
      "id, parent_name, parent_phone, parent_email, subject, student_grade, message, created_at, status",
    )
    .eq("status", "new")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as RecentBooking[] | null) ?? [];
}
