import { notFound } from "next/navigation";
import { GraduationCap, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPublishedProfileBySlug } from "@/lib/public-profile/queries";
import { BookingForm } from "./_components/booking-form";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const profile = await getPublishedProfileBySlug(supabase, slug);
  if (!profile) notFound();

  return (
    <div className="flex-1 flex flex-col bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="size-4" strokeWidth={1.75} />
            profesori.rs
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 sm:py-16 space-y-10">
        {/* Identity */}
        <section className="flex flex-col sm:flex-row sm:items-start gap-6">
          <Avatar
            name={profile.display_name}
            photoUrl={profile.photo_url}
            className="size-24 text-xl"
          />
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl font-medium tracking-tight">
                {profile.display_name}
              </h1>
              {profile.subjects.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Predaje: {profile.subjects.join(", ")}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {profile.available_for_new_students ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Prima nove učenike
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                  Trenutno ne prima nove učenike
                </span>
              )}
              {profile.price_range_text && (
                <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                  {profile.price_range_text}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Bio */}
        {profile.bio && (
          <section>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              O profesoru
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          </section>
        )}

        {/* Booking form */}
        <section>
          <div className="border-t border-border pt-8 space-y-2">
            <h2 className="text-xl font-medium tracking-tight">
              {profile.available_for_new_students
                ? "Pošalji upit"
                : "Kontakt"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile.available_for_new_students
                ? "Popuni formu, profesor će ti se javiti najkraćem mogućem roku."
                : "Profesor trenutno ne prima nove učenike, ali možeš poslati upit."}
            </p>
          </div>
          <div className="mt-6">
            <BookingForm
              organizationId={profile.organization_id}
              defaultSubjects={profile.subjects}
            />
          </div>
        </section>

        {profile.contact_email && (
          <section className="border-t border-border pt-6">
            <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
              <Mail className="size-3.5" strokeWidth={1.75} />
              Direktan kontakt:{" "}
              <a
                href={`mailto:${profile.contact_email}`}
                className="text-foreground underline underline-offset-4"
              >
                {profile.contact_email}
              </a>
            </p>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-6">
        <p className="max-w-3xl mx-auto px-6 text-xs text-muted-foreground">
          Stranica generisana putem profesori.rs
        </p>
      </footer>
    </div>
  );
}

function Avatar({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl: string | null;
  className?: string;
}) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${className ?? "size-12"}`}
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-secondary font-medium text-muted-foreground ${className ?? "size-12 text-sm"}`}
    >
      {initials || "?"}
    </span>
  );
}
