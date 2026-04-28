"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
} | undefined;

async function getCtx() {
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

function isValidSlug(s: string) {
  return /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(s);
}

export async function savePublicProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const yearsExperience =
    String(formData.get("years_experience") ?? "").trim() || null;
  const priceRange =
    String(formData.get("price_range_text") ?? "").trim() || null;
  const availableRaw = String(formData.get("available_for_new_students") ?? "");
  const available = availableRaw === "on" || availableRaw === "true";
  const contactEmail =
    String(formData.get("contact_email") ?? "").trim() || null;
  const photoUrl = String(formData.get("photo_url") ?? "").trim() || null;
  const publishedRaw = String(formData.get("published") ?? "");
  const published = publishedRaw === "on" || publishedRaw === "true";

  function parseTagArray(field: string): string[] {
    const raw = String(formData.get(field) ?? "[]").trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((s) => String(s).trim())
          .filter((s) => s.length > 0)
          .slice(0, 30);
      }
    } catch {
      // keep empty
    }
    return [];
  }
  const subjects = parseTagArray("subjects");
  const levels = parseTagArray("levels");
  const specialties = parseTagArray("specialties");
  const formats = parseTagArray("formats");

  const fieldErrors: Record<string, string> = {};
  if (!displayName) fieldErrors.display_name = "Ime je obavezno.";
  if (!slug) fieldErrors.slug = "Slug je obavezan.";
  else if (!isValidSlug(slug))
    fieldErrors.slug =
      "Slug mora biti samo mala slova, brojevi i crtice (3-40 karaktera).";

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const { supabase, orgId } = await getCtx();
  if (!orgId) return { error: "Niste prijavljeni." };

  // Slug uniqueness check (must not collide with another org's profile).
  const { data: clash } = await supabase
    .from("public_profiles")
    .select("organization_id")
    .eq("slug", slug)
    .neq("organization_id", orgId)
    .maybeSingle();

  if (clash) {
    return { fieldErrors: { slug: "Ovaj slug je već zauzet." } };
  }

  const payload = {
    organization_id: orgId,
    slug,
    display_name: displayName,
    bio,
    subjects,
    levels,
    specialties,
    formats,
    years_experience: yearsExperience,
    price_range_text: priceRange,
    available_for_new_students: available,
    contact_email: contactEmail,
    photo_url: photoUrl,
    published,
  };

  // Upsert by organization_id.
  const { error } = await supabase
    .from("public_profiles")
    .upsert(payload, { onConflict: "organization_id" });

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath(`/p/${slug}`);
  return undefined;
}
