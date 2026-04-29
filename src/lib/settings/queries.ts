import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS, type OrgSettings } from "./types";

/** Loads org settings, merged with defaults so all keys are present. */
export async function getOrgSettings(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<OrgSettings> {
  const { data } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", organizationId)
    .single();
  const stored = (data?.settings as OrgSettings | null) ?? {};
  return { ...DEFAULT_SETTINGS, ...stored };
}
