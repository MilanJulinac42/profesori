import { notFound } from "next/navigation";
import {
  getOwnPublicProfile,
  getPublishedProfileBySlug,
} from "@/lib/public-profile/queries";
import { createClient } from "@/lib/supabase/server";
import { THEMES, type ThemeId } from "@/lib/public-profile/themes";
import type { LayoutId } from "@/lib/public-profile/layouts";
import { StackLayout } from "./_layouts/stack-layout";
import { SplitLayout } from "./_layouts/split-layout";
import { MagazineLayout } from "./_layouts/magazine-layout";
import { CardLayout } from "./_layouts/card-layout";
import { PreviewBanner } from "./_components/preview-banner";

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const isPreviewRequest = sp.preview === "1";

  // In preview mode the page bypasses the `published = true` filter so the
  // owner can see the page before publishing. We still verify auth + that
  // the requester actually owns the slug — otherwise it falls back to the
  // public (cached) path. No way to peek at someone else's unpublished work.
  let profile: Awaited<ReturnType<typeof getPublishedProfileBySlug>> = null;
  let previewMode = false;

  if (isPreviewRequest) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: ownerProfile } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .single();
      if (ownerProfile) {
        const own = await getOwnPublicProfile(
          supabase,
          (ownerProfile as { organization_id: string }).organization_id,
        );
        if (own?.slug === slug) {
          profile = own;
          previewMode = true;
        }
      }
    }
  }

  if (!profile) {
    profile = await getPublishedProfileBySlug(slug);
  }
  if (!profile) notFound();

  const themeId = (profile.theme as ThemeId) ?? "aurora";
  const theme = THEMES[themeId] ?? THEMES.aurora;

  const layoutId = (profile.layout as LayoutId) ?? "stack";

  const layoutEl = (() => {
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
  })();

  if (previewMode) {
    return (
      <>
        <PreviewBanner published={profile.published ?? false} />
        {layoutEl}
      </>
    );
  }
  return layoutEl;
}
