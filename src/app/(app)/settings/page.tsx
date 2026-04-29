import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { getOrgSettings } from "@/lib/settings/queries";
import { PersonalInfoCard } from "./_components/personal-info-form";
import { OrgSettingsForm } from "./_components/org-settings-form";
import { DataExportCard } from "./_components/data-export";
import { DangerZone } from "./_components/danger-zone";

export default async function SettingsPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const org = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;

  const settings = await getOrgSettings(supabase, org!.id);

  return (
    <div className="px-4 sm:px-8 py-6 space-y-8 max-w-3xl mx-auto w-full">
      <PageHeader
        title="Podešavanja"
        description="Profil, default vrednosti, opomene, pretplata."
      />

      <PersonalInfoCard
        organizationId={org!.id}
        initialName={profile.full_name ?? ""}
        initialPhone={profile.phone ?? ""}
        initialAvatar={profile.avatar_url ?? ""}
        email={profile.email}
      />

      <OrgSettingsForm initial={settings} />

      <SubscriptionCard
        plan={org?.subscription_tier ?? "start"}
        status={org?.subscription_status ?? "trialing"}
        trialEndsAt={org?.trial_ends_at ?? null}
      />

      <DataExportCard />

      <DangerZone teacherName={profile.full_name ?? "Profesor"} />
    </div>
  );
}

function SubscriptionCard({
  plan,
  status,
  trialEndsAt,
}: {
  plan: string;
  status: string;
  trialEndsAt: string | null;
}) {
  const trialDays = trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  const statusLabel =
    status === "trialing"
      ? "Probni period"
      : status === "active"
        ? "Aktivna"
        : status === "past_due"
          ? "Plaćanje neuspešno"
          : status === "cancelled"
            ? "Otkazana"
            : status;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-medium">Pretplata</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Trenutni plan i status.
        </p>
      </div>
      <div className="px-5 py-5 space-y-3 text-sm">
        <Row
          label="Plan"
          value={
            <span className="inline-flex items-center gap-2">
              <span className="font-medium capitalize">{plan}</span>
              {plan !== "master" && (
                <Link
                  href="mailto:milanjulinac996@gmail.com?subject=Nadogradnja%20plana"
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground inline-flex items-center gap-1"
                >
                  Nadogradi
                  <ExternalLink className="size-3" strokeWidth={1.75} />
                </Link>
              )}
            </span>
          }
        />
        <Row
          label="Status"
          value={
            <span className="font-medium capitalize">{statusLabel}</span>
          }
        />
        {trialDays !== null && status === "trialing" && (
          <Row
            label="Probni period"
            value={
              <span className="font-medium tabular-nums">
                {trialDays} {trialDays === 1 ? "dan" : "dana"} preostalo
              </span>
            }
          />
        )}
        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          Promene plana ili plaćanje — kontaktiraj nas direktno na{" "}
          <Link
            href="mailto:milanjulinac996@gmail.com"
            className="text-foreground underline underline-offset-4"
          >
            milanjulinac996@gmail.com
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
