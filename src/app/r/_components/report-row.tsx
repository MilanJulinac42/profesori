"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { srLatn } from "date-fns/locale";
import { ChevronDown, ExternalLink } from "lucide-react";
import { ReportCommentForm } from "./comment-form";
import { cn } from "@/lib/utils";

type Props = {
  report: {
    id: string;
    kind: string;
    period_start: string;
    period_end: string;
    sent_at: string;
  };
};

export function ParentReportRow({ report }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="px-5 py-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform shrink-0",
              expanded && "rotate-180",
            )}
            strokeWidth={1.75}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {report.kind === "weekly"
                ? "Nedeljni izveštaj"
                : "Mesečni izveštaj"}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(report.period_start), "d. MMM", { locale: srLatn })} —{" "}
              {format(new Date(report.period_end), "d. MMM yyyy.", {
                locale: srLatn,
              })}
            </p>
          </div>
        </button>
        <Link
          href={`/reports/${report.id}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-3.5" strokeWidth={1.75} />
          Otvori
        </Link>
      </div>
      {expanded && (
        <div className="mt-3">
          <ReportCommentForm reportLogId={report.id} />
        </div>
      )}
    </li>
  );
}
