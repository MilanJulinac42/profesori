import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicProfile } from "./types";

/**
 * Get current org's public profile (for editing).
 * Returns null if not yet created.
 */
export async function getOwnPublicProfile(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<PublicProfile | null> {
  const { data } = await supabase
    .from("public_profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  return data as PublicProfile | null;
}

/**
 * Get a published profile by slug (for the public route).
 */
export async function getPublishedProfileBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<PublicProfile | null> {
  const { data } = await supabase
    .from("public_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data as PublicProfile | null;
}
