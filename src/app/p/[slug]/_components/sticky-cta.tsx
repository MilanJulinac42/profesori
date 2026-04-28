"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY;
      const passedHero = scrolled > 700;
      const bookingEl = document.getElementById("booking");
      let bookingVisible = false;
      if (bookingEl) {
        const r = bookingEl.getBoundingClientRect();
        bookingVisible = r.top < window.innerHeight - 100;
      }
      setShow(passedHero && !bookingVisible);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href="#booking"
      className={cn(
        "fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium shadow-2xl transition-all duration-200",
        show
          ? "translate-y-0 opacity-100"
          : "translate-y-12 opacity-0 pointer-events-none",
      )}
    >
      Pošalji upit
      <ArrowRight className="size-4" strokeWidth={2} />
    </a>
  );
}
