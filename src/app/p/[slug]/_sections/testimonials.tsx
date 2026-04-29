"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Quote,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type {
  PublicProfile,
  Testimonial,
} from "@/lib/public-profile/types";
import type { ThemeDef } from "@/lib/public-profile/themes";
import { Avatar } from "../_shared/avatar";
import { Stars } from "../_shared/stars";
import { cn } from "@/lib/utils";

const AUTO_ROTATE_MS = 7000;

export function TestimonialsSection({
  profile,
  theme,
}: {
  profile: PublicProfile;
  theme: ThemeDef;
}) {
  const items = profile.testimonials ?? [];
  if (items.length === 0) return null;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium tracking-tight inline-flex items-center gap-2">
          <MessageCircle className="size-5" strokeWidth={1.75} />
          Šta kažu
        </h2>
      </div>
      <Carousel items={items} cardAccentBg={theme.cardAccentBg} />
    </section>
  );
}

function Carousel({
  items,
  cardAccentBg,
}: {
  items: Testimonial[];
  cardAccentBg: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => setIndex((next + items.length) % items.length),
    [items.length],
  );
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const t = setTimeout(next, AUTO_ROTATE_MS);
    return () => clearTimeout(t);
  }, [index, paused, next, items.length]);

  return (
    <div
      className="space-y-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <FeaturedCard t={items[index]} cardAccentBg={cardAccentBg} />
          </motion.div>
        </AnimatePresence>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Prethodna"
              className="absolute left-2 top-1/2 -translate-y-1/2 size-10 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-md border border-border hover:bg-background hover:border-foreground/40 transition-colors shadow-md"
            >
              <ChevronLeft className="size-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Sledeća"
              className="absolute right-2 top-1/2 -translate-y-1/2 size-10 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-md border border-border hover:bg-background hover:border-foreground/40 transition-colors shadow-md"
            >
              <ChevronRight className="size-4" strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Preporuka ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index
                  ? "bg-foreground w-6"
                  : "bg-muted-foreground/30 w-1.5 hover:bg-muted-foreground/60",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturedCard({
  t,
  cardAccentBg,
}: {
  t: Testimonial;
  cardAccentBg: string;
}) {
  return (
    <figure className="relative overflow-hidden rounded-3xl border border-border bg-card p-7 sm:p-12 sm:pb-10">
      {cardAccentBg && (
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{ backgroundImage: cardAccentBg }}
        />
      )}
      <Quote
        className="absolute top-6 right-6 size-12 text-muted-foreground/15"
        strokeWidth={1.5}
      />
      <div className="relative space-y-5 max-w-3xl mx-auto">
        <Stars />
        <blockquote className="text-xl sm:text-2xl leading-relaxed font-light tracking-tight pr-12 sm:pr-16">
          „{t.quote}"
        </blockquote>
        <figcaption className="flex items-center gap-3 pt-4 border-t border-border">
          <Avatar
            name={t.author}
            photoUrl={null}
            className="size-11 text-sm"
          />
          <div>
            <div className="text-sm font-medium">{t.author}</div>
            {t.relation && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {t.relation}
              </div>
            )}
          </div>
        </figcaption>
      </div>
    </figure>
  );
}
