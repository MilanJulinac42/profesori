"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "./types";

export type BookingFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Partial<Record<string, string>>;
} | undefined;

/* -------- Public submission (anonymous) -------- */

export async function submitBooking(
  organizationId: string,
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const parentName = String(formData.get("parent_name") ?? "").trim();
  const parentPhone = String(formData.get("parent_phone") ?? "").trim() || null;
  const parentEmail = String(formData.get("parent_email") ?? "").trim() || null;
  const studentGrade = String(formData.get("student_grade") ?? "").trim() || null;
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim() || null;

  const fieldErrors: Record<string, string> = {};
  if (!parentName) fieldErrors.parent_name = "Ime je obavezno.";
  if (!parentPhone && !parentEmail)
    fieldErrors.parent_email = "Unesi telefon ili email.";

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("booking_requests").insert({
    organization_id: organizationId,
    parent_name: parentName,
    parent_phone: parentPhone,
    parent_email: parentEmail,
    student_grade: studentGrade,
    subject,
    message,
    status: "new",
  });

  if (error) return { error: "Slanje nije uspelo. Pokušaj ponovo." };

  return { success: true };
}

/* -------- Owner actions -------- */

async function getOwnOrgId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, orgId: null as string | null };
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  return { supabase, orgId: profile?.organization_id ?? null };
}

export async function setBookingStatus(
  bookingId: string,
  status: BookingStatus,
) {
  const { supabase } = await getOwnOrgId();
  const { error } = await supabase
    .from("booking_requests")
    .update({ status })
    .eq("id", bookingId);
  if (error) throw new Error(error.message);

  revalidatePath("/profile/inbox");
  revalidatePath("/profile");
}

export async function convertBookingToStudent(bookingId: string) {
  const { supabase, orgId } = await getOwnOrgId();
  if (!orgId) throw new Error("Niste prijavljeni.");

  const { data: booking } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (!booking) throw new Error("Upit nije pronađen.");

  // Best-effort: derive a student name from booking. If parent_name is the only
  // info we have, use that as placeholder. Profesor will edit it after.
  const studentName = booking.parent_name; // teacher will edit on the new student form

  const { data: created, error } = await supabase
    .from("students")
    .insert({
      organization_id: orgId,
      full_name: studentName,
      grade: booking.student_grade,
      parent_name: booking.parent_name,
      parent_phone: booking.parent_phone,
      parent_email: booking.parent_email,
      tags: booking.subject ? [booking.subject] : [],
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // Mark booking as converted.
  await supabase
    .from("booking_requests")
    .update({ status: "converted" })
    .eq("id", bookingId);

  revalidatePath("/profile/inbox");
  revalidatePath("/students");

  // Send teacher to the new student's edit page so they can complete details.
  redirect(`/students/${created!.id}/edit`);
}
