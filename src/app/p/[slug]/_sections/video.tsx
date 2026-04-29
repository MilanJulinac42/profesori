import { Play } from "lucide-react";
import {
  extractYouTubeId,
  type PublicProfile,
} from "@/lib/public-profile/types";

export function VideoSection({ profile }: { profile: PublicProfile }) {
  const ytId = profile.intro_video_url
    ? extractYouTubeId(profile.intro_video_url)
    : null;
  if (!ytId) return null;

  const params = new URLSearchParams();
  if (profile.intro_video_autoplay) {
    params.set("autoplay", "1");
    params.set("mute", "1");
    params.set("loop", "1");
    params.set("playlist", ytId);
    params.set("controls", "1");
    params.set("modestbranding", "1");
    params.set("rel", "0");
  }
  const src = `https://www.youtube.com/embed/${ytId}${params.toString() ? "?" + params.toString() : ""}`;

  return (
    <section className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-2">
        <Play className="size-4 text-muted-foreground" strokeWidth={1.75} />
        <h2 className="text-base font-medium">Video predstavljanje</h2>
      </div>
      <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-card aspect-video">
        <iframe
          src={src}
          title="Video predstavljanje"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </section>
  );
}
