import { ChevronDown } from "lucide-react";
import type { PublicProfile } from "@/lib/public-profile/types";

export function FaqSection({ profile }: { profile: PublicProfile }) {
  const items = profile.faq_items ?? [];
  if (items.length === 0) return null;

  return (
    <section>
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {items.map((item, i) => (
          <details key={i} className="group">
            <summary className="cursor-pointer list-none w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-secondary/40 transition-colors">
              <span className="text-sm sm:text-base font-medium">
                {item.question}
              </span>
              <ChevronDown
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                strokeWidth={1.75}
              />
            </summary>
            <p className="px-5 pb-4 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
