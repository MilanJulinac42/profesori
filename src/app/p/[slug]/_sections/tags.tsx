import { BookOpen, GraduationCap, Languages, Monitor, Trophy } from "lucide-react";
import type { PublicProfile } from "@/lib/public-profile/types";
import { TagRow } from "../_shared/tag-row";

export function TagsSection({ profile }: { profile: PublicProfile }) {
  const hasAny =
    profile.subjects.length +
      profile.levels.length +
      profile.specialties.length +
      profile.formats.length +
      profile.languages.length >
    0;
  if (!hasAny) return null;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium tracking-tight">Šta predajem</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Predmeti, nivoi i specijalnosti.
        </p>
      </div>
      <div className="space-y-3">
        {profile.subjects.length > 0 && (
          <TagRow
            title="Predmeti"
            icon={BookOpen}
            variant="primary"
            items={profile.subjects}
          />
        )}
        {profile.levels.length > 0 && (
          <TagRow
            title="Nivoi obrazovanja"
            icon={GraduationCap}
            variant="emerald"
            items={profile.levels}
          />
        )}
        {profile.specialties.length > 0 && (
          <TagRow
            title="Specijalnosti i pripreme"
            icon={Trophy}
            variant="amber"
            items={profile.specialties}
          />
        )}
        {profile.formats.length > 0 && (
          <TagRow
            title="Format časova"
            icon={Monitor}
            variant="indigo"
            items={profile.formats}
          />
        )}
        {profile.languages.length > 0 && (
          <TagRow
            title="Jezici"
            icon={Languages}
            variant="primary"
            items={profile.languages}
          />
        )}
      </div>
    </section>
  );
}
