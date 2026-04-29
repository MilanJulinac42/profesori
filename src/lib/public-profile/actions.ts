"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeSections } from "./sections";

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
  const contactPhone =
    String(formData.get("contact_phone") ?? "").trim() || null;
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
  function parseJsonArray<T>(field: string, sanitize: (item: unknown) => T | null): T[] {
    const raw = String(formData.get(field) ?? "[]").trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map(sanitize)
          .filter((x): x is T => x !== null)
          .slice(0, 50);
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
  const languages = parseTagArray("languages");

  type ItemRecord = Record<string, unknown>;
  const links = parseJsonArray("links", (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as ItemRecord;
    const t = String(item.type ?? "").trim();
    const url = String(item.url ?? "").trim();
    if (!t || !url) return null;
    return { type: t, url };
  });
  const qualifications = parseJsonArray("qualifications", (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as ItemRecord;
    const title = String(item.title ?? "").trim();
    const institution = String(item.institution ?? "").trim();
    const year = String(item.year ?? "").trim() || null;
    if (!title && !institution) return null;
    return { title, institution, year };
  });
  const experiences = parseJsonArray("experiences", (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as ItemRecord;
    const title = String(item.title ?? "").trim();
    const organization = String(item.organization ?? "").trim();
    const period = String(item.period ?? "").trim() || null;
    const description = String(item.description ?? "").trim() || null;
    if (!title && !organization) return null;
    return { title, organization, period, description };
  });
  const testimonials = parseJsonArray("testimonials", (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as ItemRecord;
    const quote = String(item.quote ?? "").trim();
    const author = String(item.author ?? "").trim();
    const relation = String(item.relation ?? "").trim() || null;
    if (!quote || !author) return null;
    return { quote, author, relation };
  });
  const pricingPackages = parseJsonArray("pricing_packages", (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as ItemRecord;
    const name = String(item.name ?? "").trim();
    const priceN = Number(item.price ?? 0);
    if (!name || !Number.isFinite(priceN) || priceN <= 0) return null;
    const sessionsN = item.sessions == null ? null : Number(item.sessions);
    const description = String(item.description ?? "").trim() || null;
    return {
      name,
      sessions:
        sessionsN != null && Number.isFinite(sessionsN) && sessionsN > 0
          ? Math.round(sessionsN)
          : null,
      price: Math.round(priceN),
      description,
      highlighted: Boolean(item.highlighted),
    };
  });

  const introVideoUrl =
    String(formData.get("intro_video_url") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;

  const themeRaw = String(formData.get("theme") ?? "aurora").trim();
  const theme = ["aurora", "minimal", "sage", "sunrise", "editorial"].includes(
    themeRaw,
  )
    ? themeRaw
    : "aurora";

  const layoutRaw = String(formData.get("layout") ?? "stack").trim();
  const layout = ["stack", "split", "magazine", "card"].includes(layoutRaw)
    ? layoutRaw
    : "stack";

  let sectionsParsed: unknown = [];
  const sectionsRaw = String(formData.get("sections") ?? "").trim();
  if (sectionsRaw) {
    try {
      sectionsParsed = JSON.parse(sectionsRaw);
    } catch {
      // ignore — normalizeSections will fall back to defaults
    }
  }
  const sections = normalizeSections(sectionsParsed);

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
    languages,
    years_experience: yearsExperience,
    price_range_text: priceRange,
    available_for_new_students: available,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    photo_url: photoUrl,
    published,
    links,
    qualifications,
    experiences,
    testimonials,
    intro_video_url: introVideoUrl,
    location,
    theme,
    layout,
    sections,
    pricing_packages: pricingPackages,
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
