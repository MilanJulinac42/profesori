import { cn } from "@/lib/utils";

export function Avatar({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl: string | null;
  className?: string;
}) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
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
