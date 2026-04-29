import { GraduationCap } from "lucide-react";
import type { PublicProfile } from "@/lib/public-profile/types";

export function QualificationsSection({
  profile,
}: {
  profile: PublicProfile;
}) {
  if (profile.qualifications.length === 0) return null;
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-medium tracking-tight inline-flex items-center gap-2">
        <GraduationCap className="size-5" strokeWidth={1.75} />
        Obrazovanje i sertifikati
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {profile.qualifications.map((q, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5"
          >
            <p className="text-base font-medium">{q.title || q.institution}</p>
            {q.institution && q.title && (
              <p className="text-sm text-muted-foreground mt-1">
                {q.institution}
              </p>
            )}
            {q.year && (
              <p className="text-xs text-muted-foreground mt-2 tabular-nums">
                {q.year}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
