import { Send, Mail } from "lucide-react";
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
  const open = profile.available_for_new_students;

  const inner = (
    <div className="relative space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center size-11 rounded-xl bg-foreground text-background shadow-[0_8px_24px_-8px_oklch(0_0_0/0.3)] shrink-0">
          {open ? (
            <Send className="size-5" strokeWidth={2.25} />
          ) : (
            <Mail className="size-5" strokeWidth={2.25} />
          )}
        </span>
        <p className="text-sm sm:text-base text-muted-foreground">
          {open
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
      className="scroll-mt-20 relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 sm:p-12 shadow-[0_24px_64px_-24px_oklch(0_0_0/0.15)] dark:shadow-[0_24px_64px_-24px_oklch(0_0_0/0.5)]"
    >
      {theme.cardAccentBg && (
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{ backgroundImage: theme.cardAccentBg }}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
      />
      {inner}
    </section>
  );
}
