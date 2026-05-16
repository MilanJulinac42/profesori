"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useMotionValue } from "motion/react";

/**
 * Counts a number up from 0 to `end` when scrolled into view. Triggers once.
 * Optional `prefix`/`suffix` for things like "+", "%", "RSD".
 */
export function CountUp({
  end,
  duration = 1.2,
  prefix = "",
  suffix = "",
  className,
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const value = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, end, { duration, ease: [0.21, 0.47, 0.32, 0.98] });
    const unsub = value.on("change", (v) => setDisplay(String(Math.round(v))));
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, end, duration, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
