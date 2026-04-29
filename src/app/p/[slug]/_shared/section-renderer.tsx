import type { PublicProfile } from "@/lib/public-profile/types";
import type { ThemeDef } from "@/lib/public-profile/themes";
import type { Section } from "@/lib/public-profile/sections";
import { BioSection } from "../_sections/bio";
import { VideoSection } from "../_sections/video";
import { GallerySection } from "../_sections/gallery";
import { TagsSection } from "../_sections/tags";
import { PricingSection } from "../_sections/pricing";
import { CalendarSection } from "../_sections/calendar";
import { ExperienceSection } from "../_sections/experience";
import { QualificationsSection } from "../_sections/qualifications";
import { TestimonialsSection } from "../_sections/testimonials";
import { FaqSection } from "../_sections/faq";
import { DirectContactSection } from "../_sections/direct-contact";

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
    case "gallery":
      return <GallerySection profile={profile} />;
    case "tags":
      return <TagsSection profile={profile} />;
    case "pricing":
      return <PricingSection profile={profile} />;
    case "calendar":
      return <CalendarSection profile={profile} />;
    case "experience":
      return <ExperienceSection profile={profile} />;
    case "qualifications":
      return <QualificationsSection profile={profile} />;
    case "testimonials":
      return <TestimonialsSection profile={profile} theme={theme} />;
    case "faq":
      return <FaqSection profile={profile} />;
    case "direct_contact":
      return <DirectContactSection profile={profile} />;
    case "stats":
      return null;
  }
}
