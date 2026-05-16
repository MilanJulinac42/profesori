import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
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
 * Anonymous Supabase client (no cookies). Used only inside cached public-route
 * queries — cookies must not leak into the cache key.
 */
function anonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Get a published profile by slug for the public route.
 *
 * Wrapped in unstable_cache with a per-slug tag — savePublicProfile calls
 * revalidateTag("profile-<slug>") on edits. revalidate is a safety net so
 * a profile never serves stale data for more than an hour.
 */
export async function getPublishedProfileBySlug(
  slug: string,
): Promise<PublicProfile | null> {
  return unstable_cache(
    async () => {
      const supabase = anonClient();
      const { data } = await supabase
        .from("public_profiles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      return data as PublicProfile | null;
    },
    ["public-profile-by-slug", slug],
    { tags: [`profile-${slug}`], revalidate: 3600 },
  )();
}
