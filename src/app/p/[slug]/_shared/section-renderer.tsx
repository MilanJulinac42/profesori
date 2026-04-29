import type { PublicProfile } from "@/lib/public-profile/types";
import type { ThemeDef } from "@/lib/public-profile/themes";
import type { Section } from "@/lib/public-profile/sections";
import { BioSection } from "../_sections/bio";
import { VideoSection } from "../_sections/video";
import { TagsSection } from "../_sections/tags";
import { PricingSection } from "../_sections/pricing";
import { ExperienceSection } from "../_sections/experience";
import { QualificationsSection } from "../_sections/qualifications";
import { TestimonialsSection } from "../_sections/testimonials";
import { DirectContactSection } from "../_sections/direct-contact";

/** Renders a non-stats section. Stats is handled per-layout (band vs compact). */
export function SectionRenderer({
  section,
  profile,
  theme,
}: {
  section: Section;
  profile: PublicProfile;
  theme: ThemeDef;
}) {
  switch (section.type) {
    case "bio":
      return <BioSection profile={profile} />;
    case "video":
      return <VideoSection profile={profile} />;
    case "tags":
      return <TagsSection profile={profile} />;
    case "pricing":
      return <PricingSection profile={profile} />;
    case "experience":
      return <ExperienceSection profile={profile} />;
    case "qualifications":
      return <QualificationsSection profile={profile} />;
    case "testimonials":
      return <TestimonialsSection profile={profile} theme={theme} />;
    case "direct_contact":
      return <DirectContactSection profile={profile} />;
    case "stats":
      return null;
  }
}
