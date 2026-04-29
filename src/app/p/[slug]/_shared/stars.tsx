import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ size = "md" }: { size?: "sm" | "md" }) {
  const cls = size === "sm" ? "size-3.5" : "size-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(cls, "fill-amber-500 text-amber-500")}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}
