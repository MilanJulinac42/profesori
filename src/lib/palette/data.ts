"use server";

import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export type PaletteStudent = {
  id: string;
  full_name: string;
  parent_name: string | null;
  parent_phone: string | null;
  grade: string | null;
  status: "active" | "paused" | "inactive";
};

export type PaletteData = {
  students: PaletteStudent[];
};

/**
 * Loads the data needed to populate the Cmd+K palette. Returns the
 * teacher's full student roster (typically dozens, never thousands —
 * client-side filtering is fast). Called lazily on first open.
 */
export async function loadPaletteData(): Promise<PaletteData> {
  await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("students")
    .select("id, full_name, parent_name, parent_phone, grade, status")
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  return {
    students: (data as PaletteStudent[] | null) ?? [],
  };
}
