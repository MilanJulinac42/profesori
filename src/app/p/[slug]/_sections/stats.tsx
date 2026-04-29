import {
  BookOpen,
  Briefcase,
  GraduationCap,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import type { PublicProfile } from "@/lib/public-profile/types";
import { extractYearsToken, pluralSr } from "../_shared/helpers";

export function StatsSection({ profile }: { profile: PublicProfile }) {
  const yearsValue = extractYearsToken(profile.years_experience);
  const stats: { value: string; label: string; icon: LucideIcon }[] = [];
  if (yearsValue) {
    stats.push({ value: yearsValue, label: "godina iskustva", icon: Briefcase });
  }
  if (profile.subjects.length > 0) {
    stats.push({
      value: String(profile.subjects.length),
      label: pluralSr(
        profile.subjects.length,
        "predmet",
        "predmeta",
        "predmeta",
      ),
      icon: BookOpen,
    });
  }
  if (profile.qualifications.length > 0) {
    stats.push({
      value: String(profile.qualifications.length),
      label: pluralSr(
        profile.qualifications.length,
        "diploma",
        "diplome",
        "diploma",
      ),
      icon: GraduationCap,
    });
  }
  if (profile.testimonials.length > 0) {
    stats.push({
      value: String(profile.testimonials.length),
      label: pluralSr(
        profile.testimonials.length,
        "preporuka",
        "preporuke",
        "preporuka",
      ),
      icon: MessageCircle,
    });
  }

  if (stats.length === 0) return null;

  return (
    <section className="border-y border-border bg-secondary/30">
      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="flex flex-col items-center text-center sm:items-start sm:text-left"
            >
              <Icon
                className="size-4 text-muted-foreground mb-2"
                strokeWidth={1.75}
              />
              <p className="text-3xl sm:text-4xl font-medium tracking-tight tabular-nums">
                {s.value}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {s.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
