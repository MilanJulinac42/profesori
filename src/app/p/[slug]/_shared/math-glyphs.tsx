import { cn } from "@/lib/utils";

/**
 * Floating decorative math/learning glyphs. Themed for tutor profiles.
 * Renders behind content with soft animation. No interactivity.
 */

type Glyph = {
  char: string;
  /** size in rem */
  size: number;
  /** opacity 0..1 */
  opacity: number;
  /** position with arbitrary CSS values */
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  /** rotation in deg */
  rotate?: number;
  /** which keyframe to use for soft motion */
  motion?: "drift-a" | "drift-b" | "drift-c" | "none";
};

const HERO_GLYPHS: Glyph[] = [
  { char: "π", size: 5, opacity: 0.12, top: "8%", left: "6%", rotate: -8, motion: "drift-a" },
  { char: "∑", size: 4, opacity: 0.1, top: "20%", right: "8%", rotate: 12, motion: "drift-b" },
  { char: "∫", size: 6, opacity: 0.09, bottom: "15%", left: "12%", rotate: -4, motion: "drift-c" },
  { char: "√", size: 3.5, opacity: 0.13, top: "50%", right: "14%", rotate: 6, motion: "drift-a" },
  { char: "∞", size: 4.5, opacity: 0.1, bottom: "22%", right: "20%", rotate: -10, motion: "drift-b" },
  { char: "ƒ", size: 3, opacity: 0.14, top: "12%", left: "40%", rotate: 4, motion: "drift-c" },
];

export function MathGlyphs({
  glyphs = HERO_GLYPHS,
  className,
}: {
  glyphs?: Glyph[];
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none select-none",
        className,
      )}
    >
      {glyphs.map((g, i) => (
        <span
          key={i}
          className={cn(
            "absolute font-display text-foreground tabular-nums",
            g.motion === "drift-a" && "animate-[drift-a_22s_ease-in-out_infinite]",
            g.motion === "drift-b" && "animate-[drift-b_28s_ease-in-out_infinite]",
            g.motion === "drift-c" && "animate-[drift-c_34s_ease-in-out_infinite]",
          )}
          style={{
            fontSize: `${g.size}rem`,
            opacity: g.opacity,
            top: g.top,
            bottom: g.bottom,
            left: g.left,
            right: g.right,
            transform: `rotate(${g.rotate ?? 0}deg)`,
            lineHeight: 1,
          }}
        >
          {g.char}
        </span>
      ))}
    </div>
  );
}

/**
 * Single watermark glyph — small decorative accent for section corners.
 */
export function CornerGlyph({
  char,
  className,
  position = "top-right",
}: {
  char: string;
  className?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}) {
  const pos = {
    "top-right": "top-2 right-3",
    "top-left": "top-2 left-3",
    "bottom-right": "bottom-2 right-3",
    "bottom-left": "bottom-2 left-3",
  }[position];

  return (
    <span
      aria-hidden
      className={cn(
        "absolute font-display text-foreground/[0.08] text-7xl select-none pointer-events-none leading-none",
        pos,
        className,
      )}
    >
      {char}
    </span>
  );
}
