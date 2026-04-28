import { requireUser } from "@/lib/supabase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const { profile } = await requireUser();
  const org = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Zdravo, {profile.full_name?.split(" ")[0] ?? "profesore"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {org?.name} · plan: {org?.subscription_tier} · status:{" "}
          {org?.subscription_status}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Učenici</CardTitle>
            <CardDescription>Nemaš nijednog učenika.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sledeći korak: dodaj prvog učenika.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Časovi danas</CardTitle>
            <CardDescription>Raspored je prazan.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dug</CardTitle>
            <CardDescription>Nema neplaćenih časova.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}
