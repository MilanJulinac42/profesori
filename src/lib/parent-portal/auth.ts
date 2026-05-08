import { cookies } from "next/headers";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const COOKIE_NAME = "profesori_parent_token";

export type ParentSession = {
  studentId: string;
  studentName: string;
  organizationId: string;
  parentName: string | null;
  teacherName: string;
};

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// Cookie set/delete je u route handler-ima — Next.js 15+ ne dozvoljava
// postavljanje cookie-ja iz server component-i.

export async function readParentToken(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE_NAME)?.value ?? null;
}

/** Validira token i vraća session info. NULL ako token ne postoji ili je revoked. */
export async function getParentSession(): Promise<ParentSession | null> {
  const token = await readParentToken();
  if (!token) return null;
  return getParentSessionByToken(token);
}

export async function getParentSessionByToken(
  token: string,
): Promise<ParentSession | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;

  const supabase = getServiceClient();
  const { data: student } = await supabase
    .from("students")
    .select(
      "id, full_name, parent_name, organization_id, parent_portal_revoked_at, deleted_at",
    )
    .eq("parent_portal_token", token)
    .maybeSingle();

  if (!student) return null;
  if (student.deleted_at) return null;
  if (student.parent_portal_revoked_at) return null;

  // Pull teacher (org owner)
  const { data: teacher } = await supabase
    .from("users")
    .select("full_name")
    .eq("organization_id", student.organization_id)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  return {
    studentId: student.id as string,
    studentName: student.full_name as string,
    organizationId: student.organization_id as string,
    parentName: (student.parent_name as string | null) ?? null,
    teacherName: ((teacher?.full_name as string) ?? null) ?? "Profesor",
  };
}
