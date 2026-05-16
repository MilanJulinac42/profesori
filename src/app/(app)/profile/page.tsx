import Link from "next/link";
import { ExternalLink, Inbox, Globe, Lightbulb, Eye } from "lucide-react";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
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
    languages: [],
    years_experience: null,
    price_range_text: null,
    available_for_new_students: true,
    contact_email: teacher.email,
    contact_phone: null,
    photo_url: null,
    published: false,
    links: [],
    qualifications: [],
    experiences: [],
    testimonials: [],
    intro_video_url: null,
    location: null,
    theme: "aurora",
    layout: "stack",
    sections: [],
    pricing_packages: [],
    faq_items: [],
    gallery_images: [],
    intro_video_autoplay: false,
    office_hours: null,
  };

  const publicUrl = profile?.published
    ? `/p/${profile.slug}`
    : null;
  const previewUrl = profile?.slug ? `/p/${profile.slug}?preview=1` : null;

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader
        title="Javni profil"
        description="Stranica koju roditelji vide kad im pošalješ link."
        actions={
          <div className="flex items-center gap-2">
            {previewUrl && (
              <Link
                href={previewUrl}
                target="_blank"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-card border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors"
                title={
                  publicUrl
                    ? "Pregled stranice (objavljena)"
                    : "Pregled pre objave — vidiš samo ti"
                }
              >
                <Eye className="size-3.5" strokeWidth={1.75} />
                Pregled
              </Link>
            )}
            {publicUrl && (
              <Link
                href={publicUrl}
                target="_blank"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-card border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors"
              >
                <ExternalLink className="size-3.5" strokeWidth={1.75} />
                Javni link
              </Link>
            )}
            <Link
              href="/profile/inbox"
              className={
                newBookings > 0
                  ? "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all glow-brand"
                  : "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-card border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors"
              }
            >
              <Inbox className="size-3.5" strokeWidth={1.75} />
              Upiti
              {newBookings > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-brand-foreground text-brand text-[10px] font-bold px-1 ml-0.5 tabular-nums">
                  {newBookings}
                </span>
              )}
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <ProfileForm initial={initial} organizationId={org!.id} />

        <aside className="space-y-3 lg:sticky lg:top-20 self-start">
          <div className="card-elevated card-glow rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg tile-cyan shrink-0">
                <Globe className="size-3.5" strokeWidth={2} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">
                Tvoj javni link
              </p>
            </div>
            <p className="text-sm font-mono break-all px-2.5 py-1.5 rounded-md bg-secondary/60 text-foreground">
              /p/{initial.slug}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed inline-flex items-center gap-1.5">
              {profile?.published ? (
                <>
                  <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 pulse-dot" />
                  <span className="text-emerald-500 dark:text-emerald-400 font-medium">
                    Aktiviran
                  </span>
                  <span>— vidljiv svima sa linkom.</span>
                </>
              ) : (
                <>
                  <span className="size-1.5 rounded-full bg-muted-foreground" />
                  <span>
                    Nije aktiviran. Uključi „Objavi profil“ da bi link radio.
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="card-elevated card-glow rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg tile-amber shrink-0">
                <Lightbulb className="size-3.5" strokeWidth={2} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">
                Šta uneti
              </p>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              {[
                "Predmete koje predaješ",
                "Nivoe i specijalnosti (priprema za maturu, ...)",
                "Kratku biografiju i iskustvo",
                "Cenovni raspon (npr. „od 1500 RSD/čas“)",
                "Fotografiju",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="text-brand mt-0.5 shrink-0"
                  >
                    →
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
