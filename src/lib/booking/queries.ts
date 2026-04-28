import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookingRequest, BookingStatus } from "./types";

export async function getBookingRequests(
  supabase: SupabaseClient,
  filter?: { status?: BookingStatus | "all" },
): Promise<BookingRequest[]> {
  let q = supabase
    .from("booking_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (filter?.status && filter.status !== "all") {
    q = q.eq("status", filter.status);
  }
  const { data } = await q;
  return (data as BookingRequest[] | null) ?? [];
}

export async function countNewBookings(
  supabase: SupabaseClient,
): Promise<number> {
  const { count } = await supabase
    .from("booking_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");
  return count ?? 0;
}
