import { GraduationCap } from "lucide-react";
import type { PublicProfile } from "@/lib/public-profile/types";
import type { ThemeDef } from "@/lib/public-profile/themes";
import {
  normalizeSections,
  shouldRenderSection,
} from "@/lib/public-profile/sections";
import { cn } from "@/lib/utils";
import { StickyCta } from "../_components/sticky-cta";
import { HeroSection } from "../_sections/hero";
import { StatsSection } from "../_sections/stats";
import { BookingSection } from "../_sections/booking";
import { SectionRenderer } from "../_shared/section-renderer";

export function StackLayout({
  profile,
  theme,
}: {
  profile: PublicProfile;
  theme: ThemeDef;
}) {
  const sections = normalizeSections(profile.sections);
  const statsSection = sections.find((s) => s.type === "stats");
  const statsBeforeMain =
    statsSection?.visible && shouldRenderSection("stats", profile);
  const mainSections = sections.filter(
    (s) =>
      s.type !== "stats" && s.visible && shouldRenderSection(s.type, profile),
  );

  return (
    <div
      className={cn(
        "flex-1 flex flex-col bg-background",
        theme.serifHeadings && "theme-editorial",
      )}
    >
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm">
            <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-background">
              <GraduationCap className="size-3.5" strokeWidth={2} />
            </span>
            <span className="font-medium">profesori.rs</span>
          </span>
          <a
            href="#booking"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Pošalji upit ↓
          </a>
        </div>
      </header>

      <HeroSection profile={profile} theme={theme} />
      {statsBeforeMain && <StatsSection profile={profile} />}

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 sm:py-16 space-y-16">
        {mainSections.map((s) => (
          <SectionRenderer key={s.type} section={s} profile={profile} theme={theme} />
        ))}
        <BookingSection profile={profile} theme={theme} />
      </main>

      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Stranica generisana putem{" "}
            <span className="text-foreground font-medium">profesori.rs</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Privatni časovi · evidencija direktno između profesora i učenika
          </p>
        </div>
      </footer>

      {profile.available_for_new_students && <StickyCta />}
    </div>
  );
}
