import { Mail } from "lucide-react";
import type { PublicProfile } from "@/lib/public-profile/types";

export function DirectContactSection({
  profile,
}: {
  profile: PublicProfile;
}) {
  if (!profile.contact_email) return null;
  return (
    <section className="text-center">
      <p className="text-sm text-muted-foreground">Više voliš email?</p>
      <a
        href={`mailto:${profile.contact_email}`}
        className="mt-1 inline-flex items-center gap-2 text-sm text-foreground underline underline-offset-4"
      >
        <Mail className="size-3.5" strokeWidth={1.75} />
        {profile.contact_email}
      </a>
    </section>
  );
}
