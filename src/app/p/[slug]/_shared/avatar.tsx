import Image from "next/image";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  photoUrl,
  className,
  priority = false,
  sizes = "180px",
}: {
  name: string;
  photoUrl: string | null;
  className?: string;
  /** Set true for the LCP avatar (hero photo on /p/[slug]). */
  priority?: boolean;
  /** Passed to next/image sizes prop — caller hint for responsive selection. */
  sizes?: string;
}) {
  if (photoUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 rounded-full overflow-hidden",
          className,
        )}
      >
        <Image
          src={photoUrl}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-secondary font-medium text-muted-foreground",
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}
