"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseRsdInput } from "@/lib/money";
import type { PaymentMethod } from "./types";

export type PaymentFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
} | undefined;

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

const VALID_METHODS: PaymentMethod[] = ["cash", "transfer", "revolut", "other"];

export async function recordPayment(
  studentId: string,
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const paidAt = String(formData.get("paid_at") ?? "").trim();
  const method = String(formData.get("method") ?? "cash") as PaymentMethod;
  const note = String(formData.get("note") ?? "").trim() || null;

  const fieldErrors: Record<string, string> = {};
  if (!amountRaw) fieldErrors.amount = "Iznos je obavezan.";
  if (!paidAt) fieldErrors.paid_at = "Datum je obavezan.";
  if (!VALID_METHODS.includes(method))
    fieldErrors.method = "Nevalidan način.";

  let amountPara = 0;
  if (amountRaw) {
    const parsed = parseRsdInput(amountRaw);
    if (parsed === null || parsed <= 0)
      fieldErrors.amount = "Iznos mora biti pozitivan broj.";
    else amountPara = parsed;
  }

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const { supabase, orgId } = await getOrgId();
  if (!orgId) return { error: "Niste prijavljeni." };

  const paidAtIso = new Date(`${paidAt}T12:00:00`).toISOString();
  if (isNaN(new Date(paidAtIso).getTime()))
    return { fieldErrors: { paid_at: "Neispravan datum." } };

  const { error } = await supabase.from("payments").insert({
    organization_id: orgId,
    student_id: studentId,
    amount: amountPara,
    paid_at: paidAtIso,
    method,
    note,
  });

  if (error) return { error: error.message };

  revalidatePath("/billing");
  revalidatePath("/dashboard");
  revalidatePath(`/students/${studentId}`);
  return undefined;
}

export async function deletePayment(paymentId: string) {
  const { supabase } = await getOrgId();

  const { data: existing } = await supabase
    .from("payments")
    .select("student_id")
    .eq("id", paymentId)
    .single();

  const { error } = await supabase
    .from("payments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", paymentId);

  if (error) throw new Error(error.message);

  revalidatePath("/billing");
  revalidatePath("/dashboard");
  if (existing?.student_id) revalidatePath(`/students/${existing.student_id}`);
}
