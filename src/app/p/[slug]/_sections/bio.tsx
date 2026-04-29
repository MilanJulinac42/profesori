import { Quote } from "lucide-react";
import type { PublicProfile } from "@/lib/public-profile/types";

export function BioSection({ profile }: { profile: PublicProfile }) {
  if (!profile.bio) return null;
  return (
    <section className="relative max-w-3xl">
      <Quote
        className="absolute -top-2 -left-2 size-8 text-muted-foreground/20"
        strokeWidth={1.5}
      />
      <p className="relative text-xl sm:text-2xl leading-relaxed font-light tracking-tight pl-6">
        {profile.bio}
      </p>
      <div className="flex justify-center pt-10">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </section>
  );
}
