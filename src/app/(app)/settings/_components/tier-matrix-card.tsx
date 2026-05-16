import { Check, Minus } from "lucide-react";
import {
  FEATURE_LABELS,
  TIER_LABELS,
  TIER_DESCRIPTIONS,
  TIER_MATRIX,
  TIERS,
  type Feature,
  type Tier,
} from "@/lib/subscription/tiers";

const FEATURES_ORDER: Feature[] = [
  "unlimited_students",
  "public_profile",
  "parent_portal",
  "schedule_drag_drop",
  "bulk_schedule_actions",
  "csv_import",
  "google_calendar_sync",
  "automatic_reminders",
  "automatic_reports",
  "custom_reminder_template",
  "custom_report_closing",
  "ai_assistant",
  "ai_voice_input",
  "ai_exercises",
  "ai_lesson_notes_transcription",
];

/**
 * Shows what each subscription tier includes. The current plan column is
 * highlighted. Read-only — billing UI lives elsewhere (still email-only for
 * now, see SubscriptionCard).
 */
export function TierMatrixCard({ currentPlan }: { currentPlan: string }) {
  const tiers = TIERS;
  const isCurrent = (t: Tier) => t === currentPlan;

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-medium">Pregled paketa</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Šta dolazi sa kojim paketom. Tvoj trenutni paket je istaknut.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground sticky left-0 bg-card z-10">
                Funkcija
              </th>
              {tiers.map((t) => (
                <th
                  key={t}
                  className={
                    isCurrent(t)
                      ? "text-center px-3 py-3 bg-brand-soft/40 dark:bg-[oklch(0.78_0.16_205/0.08)] min-w-[100px]"
                      : "text-center px-3 py-3 min-w-[100px]"
                  }
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className={
                        isCurrent(t)
                          ? "font-semibold text-foreground"
                          : "font-medium text-muted-foreground"
                      }
                    >
                      {TIER_LABELS[t]}
                    </span>
                    {isCurrent(t) && (
                      <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-brand">
                        Tvoj plan
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES_ORDER.map((f) => (
              <tr key={f} className="border-b border-border/40">
                <td className="px-4 py-2.5 text-foreground sticky left-0 bg-card z-10">
                  {FEATURE_LABELS[f]}
                </td>
                {tiers.map((t) => {
                  const has = TIER_MATRIX[t].features[f];
                  return (
                    <td
                      key={t}
                      className={
                        isCurrent(t)
                          ? "text-center px-3 py-2.5 bg-brand-soft/30 dark:bg-[oklch(0.78_0.16_205/0.05)]"
                          : "text-center px-3 py-2.5"
                      }
                    >
                      {has ? (
                        <Check
                          className="size-3.5 inline text-emerald-500"
                          strokeWidth={2.5}
                          aria-label="Uključeno"
                        />
                      ) : (
                        <Minus
                          className="size-3.5 inline text-muted-foreground/40"
                          strokeWidth={2}
                          aria-label="Nije uključeno"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Caps row */}
            <tr className="border-b border-border/40">
              <td className="px-4 py-2.5 text-foreground sticky left-0 bg-card z-10">
                Maks. broj učenika
              </td>
              {tiers.map((t) => {
                const cap = TIER_MATRIX[t].caps.max_students;
                return (
                  <td
                    key={t}
                    className={
                      isCurrent(t)
                        ? "text-center px-3 py-2.5 bg-brand-soft/30 dark:bg-[oklch(0.78_0.16_205/0.05)]"
                        : "text-center px-3 py-2.5"
                    }
                  >
                    <span className="text-xs tabular-nums text-foreground">
                      {cap === null ? "∞" : cap}
                    </span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-foreground sticky left-0 bg-card z-10">
                AI poruka / dan
              </td>
              {tiers.map((t) => {
                const cap = TIER_MATRIX[t].caps.max_assistant_messages_per_day;
                return (
                  <td
                    key={t}
                    className={
                      isCurrent(t)
                        ? "text-center px-3 py-2.5 bg-brand-soft/30 dark:bg-[oklch(0.78_0.16_205/0.05)]"
                        : "text-center px-3 py-2.5"
                    }
                  >
                    <span className="text-xs tabular-nums text-foreground">
                      {cap === null ? "∞" : cap}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-border bg-secondary/30 text-[11px] text-muted-foreground space-y-1">
        {TIERS.map((t) => (
          <p key={t}>
            <span className="font-medium text-foreground">{TIER_LABELS[t]}:</span>{" "}
            {TIER_DESCRIPTIONS[t]}
          </p>
        ))}
      </div>
    </section>
  );
}
