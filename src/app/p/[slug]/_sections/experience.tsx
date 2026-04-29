import { Briefcase } from "lucide-react";
import type { PublicProfile } from "@/lib/public-profile/types";

export function ExperienceSection({ profile }: { profile: PublicProfile }) {
  if (profile.experiences.length === 0) return null;
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-medium tracking-tight inline-flex items-center gap-2">
        <Briefcase className="size-5" strokeWidth={1.75} />
        Iskustvo
      </h2>
      <ol className="relative border-l-2 border-border ml-2 space-y-7 pl-6">
        {profile.experiences.map((exp, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[31px] top-1.5 flex size-3.5 items-center justify-center rounded-full bg-foreground ring-4 ring-background" />
            <div className="space-y-1">
              <p className="text-base font-medium">{exp.title}</p>
              <p className="text-sm text-muted-foreground">
                {exp.organization}
                {exp.period && (
                  <>
                    <span className="mx-2 text-muted-foreground/40">·</span>
                    {exp.period}
                  </>
                )}
              </p>
              {exp.description && (
                <p className="text-sm leading-relaxed mt-2">
                  {exp.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
