import type { PublicProfile } from "@/lib/public-profile/types";
import type { ThemeDef } from "@/lib/public-profile/themes";
import { BookingForm } from "../_components/booking-form";

type Variant = "card" | "embedded";

export function BookingSection({
  profile,
  theme,
  variant = "card",
}: {
  profile: PublicProfile;
  theme: ThemeDef;
  variant?: Variant;
}) {
  const inner = (
    <div className="relative space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-medium tracking-tight">
          {profile.available_for_new_students ? "Pošalji upit" : "Kontakt"}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {profile.available_for_new_students
            ? "Popuni kratku formu — javiće ti se uskoro."
            : "Profesor trenutno ne prima nove učenike, ali možeš poslati upit."}
        </p>
      </div>
      <BookingForm
        organizationId={profile.organization_id}
        defaultSubjects={profile.subjects}
      />
    </div>
  );

  if (variant === "embedded") {
    return (
      <section id="booking" className="scroll-mt-20 py-2">
        {inner}
      </section>
    );
  }

  return (
    <section
      id="booking"
      className="scroll-mt-20 relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10"
    >
      {theme.cardAccentBg && (
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{ backgroundImage: theme.cardAccentBg }}
        />
      )}
      {inner}
    </section>
  );
}
