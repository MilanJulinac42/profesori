"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

/**
 * Fade + slide up when scrolled into view. Triggers once, won't reverse.
 * Wrap any block that should "appear" as the user scrolls down.
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  duration = 0.55,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade + slide up immediately on mount (no scroll trigger).
 * Used for above-the-fold content like the hero.
 */
export function RevealOnMount({
  children,
  delay = 0,
  y = 14,
  duration = 0.6,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
