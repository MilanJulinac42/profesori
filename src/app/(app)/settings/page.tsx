import { requireUser } from "@/lib/supabase/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const { profile } = await requireUser();
  const org = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;

  return (
    <div className="px-4 sm:px-8 py-8 space-y-8 max-w-3xl mx-auto w-full">
      <PageHeader
        title="Podešavanja"
        description="Profil, default cena, podsetnici, pretplata."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Tvoji podaci i kontakt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Ime i prezime" value={profile.full_name ?? "—"} />
          <Row label="Email" value={profile.email} />
          <Row label="Telefon" value={profile.phone ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pretplata</CardTitle>
          <CardDescription>Tvoj trenutni plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Plan" value={org?.subscription_tier ?? "—"} />
          <Row
            label="Status"
            value={
              org?.subscription_status === "trialing"
                ? "Probni period"
                : org?.subscription_status ?? "—"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border last:border-0 pb-2 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
