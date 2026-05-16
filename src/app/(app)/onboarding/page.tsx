import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgSettings } from "@/lib/settings/queries";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";
import { OnboardingWizard } from "./_components/wizard";

export const metadata = {
  title: "Dobrodošli — Profesori",
};

export default async function OnboardingPage() {
  const { profile } = await requireUser();

  // Already finished? Just go to the dashboard. The wizard is a one-shot.
  if (profile.onboarding_completed_at) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const org = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;

  const settings = org
    ? await getOrgSettings(supabase, org.id)
    : DEFAULT_SETTINGS;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-8">
      <OnboardingWizard
        teacherName={profile.full_name ?? profile.email}
        initialPriceRsd={
          (settings.default_price_per_lesson ??
            DEFAULT_SETTINGS.default_price_per_lesson!) / 100
        }
        initialDuration={
          settings.default_lesson_duration_minutes ??
          DEFAULT_SETTINGS.default_lesson_duration_minutes!
        }
      />
    </div>
  );
}
