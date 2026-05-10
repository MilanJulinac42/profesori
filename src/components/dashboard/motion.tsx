"use client";

import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

export function MountFade({
  children,
  delay = 0,
  y = 12,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  delay = 0,
  step = 0.06,
  className,
}: {
  children: ReactNode[];
  delay?: number;
  step?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <MountFade key={i} delay={delay + i * step}>
          {child}
        </MountFade>
      ))}
    </div>
  );
}

export type CountUpFormat = "number" | "rsd" | "percent";

const NUMBER_FMT = new Intl.NumberFormat("sr-Latn-RS", {
  maximumFractionDigits: 0,
});

function formatValue(n: number, fmt: CountUpFormat): string {
  switch (fmt) {
    case "rsd":
      // n is in paras (RSD * 100); convert and format
      return NUMBER_FMT.format(Math.round(n / 100));
    case "percent":
      return `${Math.round(n)}%`;
    case "number":
    default:
      return NUMBER_FMT.format(Math.round(n));
  }
}

export function CountUp({
  value,
  className,
  format = "number",
  duration = 1.4,
}: {
  value: number;
  className?: string;
  format?: CountUpFormat;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, {
    stiffness: 80 / duration,
    damping: 20,
    mass: 1,
  });

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      if (ref.current) ref.current.textContent = formatValue(latest, format);
    });
  }, [spring, format]);

  return (
    <span ref={ref} className={className}>
      {formatValue(0, format)}
    </span>
  );
}
