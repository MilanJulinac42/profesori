import {
  BookOpen,
  Briefcase,
  GraduationCap,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import type { PublicProfile } from "@/lib/public-profile/types";
import { extractYearsToken, pluralSr } from "../_shared/helpers";
import { cn } from "@/lib/utils";

type Variant = "band" | "compact";

export function StatsSection({
  profile,
  variant = "band",
}: {
  profile: PublicProfile;
  variant?: Variant;
}) {
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

  if (variant === "band") {
    return (
      <section className="border-y border-border bg-secondary/30">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <StatCell key={i} stat={s} />
          ))}
        </div>
      </section>
    );
  }

  // compact: card grid (used inside Split layout's main column)
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card",
        "p-5 grid grid-cols-2 sm:grid-cols-4 gap-6",
      )}
    >
      {stats.map((s, i) => (
        <StatCell key={i} stat={s} />
      ))}
    </section>
  );
}

function StatCell({
  stat,
}: {
  stat: { value: string; label: string; icon: LucideIcon };
}) {
  const Icon = stat.icon;
  return (
    <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
      <Icon className="size-4 text-muted-foreground mb-2" strokeWidth={1.75} />
      <p className="text-2xl sm:text-3xl font-medium tracking-tight tabular-nums">
        {stat.value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
    </div>
  );
}
