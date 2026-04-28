"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReminderChannel } from "./types";

async function getOrgId() {
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

export async function logReminder(input: {
  studentId: string;
  channel: ReminderChannel;
  message: string;
  amountAtSend: number;
}) {
  const { supabase, orgId } = await getOrgId();
  if (!orgId) throw new Error("Niste prijavljeni.");

  const { error } = await supabase.from("reminder_logs").insert({
    organization_id: orgId,
    student_id: input.studentId,
    channel: input.channel,
    amount_at_send: input.amountAtSend,
    message: input.message,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/students/${input.studentId}`);
  revalidatePath("/billing");
}
