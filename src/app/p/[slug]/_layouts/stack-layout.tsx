import { GraduationCap } from "lucide-react";
import type { PublicProfile } from "@/lib/public-profile/types";
import type { ThemeDef } from "@/lib/public-profile/themes";
import {
  normalizeSections,
  shouldRenderSection,
} from "@/lib/public-profile/sections";
import { cn } from "@/lib/utils";
import { StickyCta } from "../_components/sticky-cta";
import { QuickContactDock } from "../_components/quick-contact-dock";
import { HeroSection } from "../_sections/hero";
import { StatsSection } from "../_sections/stats";
import { BookingSection } from "../_sections/booking";
import { SectionRenderer } from "../_shared/section-renderer";
import { MagazineSectionHeader } from "../_shared/section-header";
import { Reveal } from "@/components/reveal";

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
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background shadow-[0_2px_8px_-2px_oklch(0_0_0/0.3)]">
              <GraduationCap className="size-4" strokeWidth={2} />
            </span>
            <span className="font-semibold tracking-tight">profesori.rs</span>
          </a>
          {profile.available_for_new_students && (
            <a
              href="#booking"
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Pošalji upit
              <span aria-hidden>↓</span>
            </a>
          )}
        </div>
      </header>

      <HeroSection profile={profile} theme={theme} />
      {statsBeforeMain && <StatsSection profile={profile} />}

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16 sm:py-20 space-y-20">
        {mainSections.map((s, i) => (
          <Reveal key={s.type}>
            <div>
              <MagazineSectionHeader index={i + 1} type={s.type} />
              <SectionRenderer section={s} profile={profile} theme={theme} />
            </div>
          </Reveal>
        ))}
        <Reveal>
          <div>
            <MagazineSectionHeader
              index={mainSections.length + 1}
              type="direct_contact"
            />
            <BookingSection profile={profile} theme={theme} />
          </div>
        </Reveal>
      </main>

      <footer className="border-t border-border/60 py-10 mt-8 relative">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
        />
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
          >
            <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-background">
              <GraduationCap className="size-3" strokeWidth={2.25} />
            </span>
            <span className="font-semibold">profesori.rs</span>
          </a>
          <p className="text-xs text-muted-foreground max-w-md">
            Privatni časovi · evidencija direktno između profesora i učenika
          </p>
        </div>
      </footer>

      {profile.available_for_new_students && <StickyCta />}
      <QuickContactDock
        phone={profile.contact_phone}
        email={profile.contact_email}
      />
    </div>
  );
}
