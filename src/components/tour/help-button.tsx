"use client";

import { useState } from "react";
import { HelpCircle, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTour } from "./tour-provider";
import { TOUR_LIST, type TourId } from "./tours";

export function HelpButton() {
  const { startTour } = useTour();
  const [open, setOpen] = useState(false);

  function run(id: TourId) {
    setOpen(false);
    // Veće kašnjenje da se dropdown sigurno zatvori (animacija) pre nego što
    // se driver.js overlay digne. Bez ovog dropdown ostaje vidljiv ispod.
    setTimeout(() => startTour(id), 250);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        data-tour="help-button"
        aria-label="Pomoć i obilasci"
        className="inline-flex items-center justify-center size-8 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition"
      >
        <HelpCircle className="size-4" strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-0" align="end" sideOffset={8}>
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-medium inline-flex items-center gap-1.5">
            <Sparkles className="size-3" strokeWidth={2} />
            Vodiči kroz aplikaciju
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Klikni za korak-po-korak prikaz dela aplikacije.
          </p>
        </div>
        <ul className="py-1">
          {TOUR_LIST.map((tour) => (
            <li key={tour.id}>
              <button
                type="button"
                onClick={() => run(tour.id)}
                className="w-full text-left px-3 py-2 hover:bg-secondary transition"
              >
                <div className="text-sm font-medium">{tour.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {tour.description}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
