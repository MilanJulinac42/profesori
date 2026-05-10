import { cn } from "@/lib/utils";

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-7 text-[11px]",
  md: "size-8 text-xs",
  lg: "size-9 text-[13px]",
  xl: "size-11 text-sm",
};

// Curated gradient pairs — deterministic pick by name hash.
// Keep them harmonious with the dark navy + cyan/magenta brand palette.
const GRADIENTS = [
  ["oklch(0.78 0.16 205)", "oklch(0.65 0.22 240)"], // cyan → blue
  ["oklch(0.7 0.27 340)", "oklch(0.62 0.25 285)"], // magenta → violet
  ["oklch(0.72 0.18 70)", "oklch(0.68 0.22 35)"], // amber → orange
  ["oklch(0.7 0.2 150)", "oklch(0.72 0.18 195)"], // emerald → teal
  ["oklch(0.7 0.22 25)", "oklch(0.65 0.27 340)"], // rose → magenta
  ["oklch(0.65 0.22 285)", "oklch(0.78 0.16 205)"], // violet → cyan
  ["oklch(0.7 0.18 220)", "oklch(0.72 0.2 195)"], // sky → teal
  ["oklch(0.72 0.18 75)", "oklch(0.7 0.2 150)"], // amber → emerald
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

type Props = {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Override the auto-picked gradient pair */
  gradient?: [string, string];
};

export function Avatar({ name, size = "md", className, gradient }: Props) {
  const idx = hashName(name) % GRADIENTS.length;
  const [from, to] = gradient ?? GRADIENTS[idx]!;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 select-none",
        "shadow-[inset_0_1px_0_oklch(1_0_0/0.2),0_1px_2px_oklch(0_0_0/0.2)]",
        SIZE[size],
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
      }}
      aria-label={name}
    >
      {initialsOf(name)}
    </span>
  );
}
