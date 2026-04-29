import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublishedProfileBySlug } from "@/lib/public-profile/queries";
import { THEMES, type ThemeId } from "@/lib/public-profile/themes";
import type { LayoutId } from "@/lib/public-profile/layouts";
import { StackLayout } from "./_layouts/stack-layout";
import { SplitLayout } from "./_layouts/split-layout";
import { MagazineLayout } from "./_layouts/magazine-layout";
import { CardLayout } from "./_layouts/card-layout";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const profile = await getPublishedProfileBySlug(supabase, slug);
  if (!profile) notFound();

  const themeId = (profile.theme as ThemeId) ?? "aurora";
  const theme = THEMES[themeId] ?? THEMES.aurora;

  const layoutId = (profile.layout as LayoutId) ?? "stack";

  switch (layoutId) {
    case "split":
      return <SplitLayout profile={profile} theme={theme} />;
    case "magazine":
      return <MagazineLayout profile={profile} theme={theme} />;
    case "card":
      return <CardLayout profile={profile} theme={theme} />;
    case "stack":
    default:
      return <StackLayout profile={profile} theme={theme} />;
  }
}
