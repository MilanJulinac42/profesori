import { redirect } from "next/navigation";
import { createClient } from "./server";

/**
 * Returns the current authenticated user joined with their profile + organization.
 * Redirects to /login if not authenticated.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, email, full_name, phone, avatar_url, role, organization_id, organizations(*)")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    // Auth user exists but profile row missing — shouldn't happen if trigger worked.
    redirect("/login");
  }

  return { authUser: user, profile, supabase };
}
