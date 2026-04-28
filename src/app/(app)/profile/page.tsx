import Link from "next/link";
import { ExternalLink, Inbox } from "lucide-react";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getOwnPublicProfile } from "@/lib/public-profile/queries";
import { countNewBookings } from "@/lib/booking/queries";
import { ProfileForm } from "./_components/profile-form";

export default async function PublicProfilePage() {
  const { profile: teacher } = await requireUser();
  const supabase = await createClient();

  const org = Array.isArray(teacher.organizations)
    ? teacher.organizations[0]
    : teacher.organizations;

  const [profile, newBookings] = await Promise.all([
    getOwnPublicProfile(supabase, org!.id),
    countNewBookings(supabase),
  ]);

  // Defaults if no profile yet.
  const initial = profile ?? {
    slug: org?.slug ?? "",
    display_name: teacher.full_name ?? teacher.email,
    bio: null,
    subjects: [],
    levels: [],
    specialties: [],
    formats: [],
    years_experience: null,
    price_range_text: null,
    available_for_new_students: true,
    contact_email: teacher.email,
    photo_url: null,
    published: false,
  };

  const publicUrl = profile?.published
    ? `/p/${profile.slug}`
    : null;

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-5xl mx-auto w-full">
      <PageHeader
        title="Javni profil"
        description="Stranica koju roditelji vide kad im pošalješ link."
        actions={
          <div className="flex items-center gap-2">
            {publicUrl && (
              <Link
                href={publicUrl}
                target="_blank"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <ExternalLink className="size-3.5" strokeWidth={1.75} />
                Otvori javnu stranicu
              </Link>
            )}
            <Link
              href="/profile/inbox"
              className={buttonVariants({
                variant: newBookings > 0 ? "default" : "outline",
                size: "sm",
              })}
            >
              <Inbox className="size-3.5" strokeWidth={1.75} />
              Upiti
              {newBookings > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-background text-foreground text-[10px] font-medium px-1 ml-1">
                  {newBookings}
                </span>
              )}
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <ProfileForm initial={initial} organizationId={org!.id} />

        <aside className="space-y-3 lg:sticky lg:top-20 self-start">
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Tvoj javni link
            </p>
            <p className="text-sm font-mono break-all">/p/{initial.slug}</p>
            <p className="text-[11px] text-muted-foreground">
              {profile?.published
                ? "Aktiviran — vidljiv svima sa linkom."
                : "Nije aktiviran. Uključi ‘Objavi profil’ da bi link radio."}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Šta uneti
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <li>· Predmete koje predaješ</li>
              <li>· Kratku biografiju (ko si, koliko godina iskustva)</li>
              <li>· Cenovni raspon (npr. „od 1500 RSD/čas“)</li>
              <li>· Foto (URL slike koju si negde okačio)</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
