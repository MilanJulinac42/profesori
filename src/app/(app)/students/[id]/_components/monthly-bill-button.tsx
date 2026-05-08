"use client";

import { FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format, subMonths } from "date-fns";
import { srLatn } from "date-fns/locale";

const MONTH_OPTIONS = 6;
const YEAR_OPTIONS = 4;

export function MonthlyBillButton({ studentId }: { studentId: string }) {
  const today = new Date();
  const currentYear = today.getFullYear();

  const months = Array.from({ length: MONTH_OPTIONS }, (_, i) => {
    const d = subMonths(today, i);
    return {
      key: format(d, "yyyy-MM"),
      label: format(d, "LLLL yyyy.", { locale: srLatn }),
    };
  });

  const years = Array.from(
    { length: YEAR_OPTIONS },
    (_, i) => currentYear - i,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="sm" variant="outline">
            <FileText className="size-3.5" strokeWidth={2} />
            Dokumenti
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={4} className="w-56">
        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          Mesečni računčić
        </div>
        {months.map((m) => (
          <DropdownMenuItem
            key={m.key}
            render={
              <a
                href={`/students/${studentId}/bill?month=${m.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="capitalize cursor-pointer"
              >
                {m.label}
              </a>
            }
          />
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          Godišnji dnevnik
        </div>
        {years.map((y) => (
          <DropdownMenuItem
            key={y}
            render={
              <a
                href={`/students/${studentId}/yearbook?year=${y}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                Godina {y}.
              </a>
            }
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
