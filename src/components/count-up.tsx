"use client";

import { useEffect, useRef, useState } from "react";

const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Counts a number up from 0 to `end` when scrolled into view. Triggers once.
 * Optional `prefix`/`suffix` for things like "+", "%", "RSD".
 * Vanilla rAF + IntersectionObserver — no motion lib.
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
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let started = false;
    let rafId = 0;
    const run = () => {
      if (started) return;
      started = true;
      const start = performance.now();
      const ms = duration * 1000;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / ms);
        setDisplay(Math.round(EASE_OUT(t) * end));
        if (t < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            run();
            io.unobserve(el);
          }
        }
      },
      { rootMargin: "-40px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
