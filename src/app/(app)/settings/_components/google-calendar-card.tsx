"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Calendar,
  Check,
  AlertCircle,
  Loader2,
  X,
  Plus,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listCalendarsAction,
  selectCalendarAction,
  createProfesoriCalendarAction,
  type CalendarOption,
} from "@/lib/google/actions";

type Props = {
  connected: boolean;
  googleEmail: string | null;
  calendarId: string | null;
  calendarName: string | null;
  // Status iz query params (?google_connected=1 ili ?google_error=...)
  bannerKind?: "connected" | "error" | null;
  bannerError?: string | null;
};

export function GoogleCalendarCard({
  connected,
  googleEmail,
  calendarId,
  calendarName,
  bannerKind,
  bannerError,
}: Props) {
  const [calendars, setCalendars] = useState<CalendarOption[] | null>(null);
  const [loadingCals, setLoadingCals] = useState(false);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected) return;
    setLoadingCals(true);
    listCalendarsAction()
      .then((res) => {
        setLoadingCals(false);
        if (res.ok) setCalendars(res.calendars);
      })
      .catch(() => setLoadingCals(false));
  }, [connected]);

  function selectCal(id: string, name: string) {
    setActionError(null);
    startTransition(async () => {
      const res = await selectCalendarAction(id, name);
      if (!res.ok) setActionError(res.error);
    });
  }

  function createNew() {
    setActionError(null);
    startTransition(async () => {
      const res = await createProfesoriCalendarAction();
      if (!res.ok) {
        setActionError(res.error);
        return;
      }
      // Refresh lista
      const list = await listCalendarsAction();
      if (list.ok) setCalendars(list.calendars);
    });
  }

  async function disconnect() {
    if (
      !confirm(
        "Sigurno da prekineš vezu? Postojeći časovi u Google Calendar-u ostaće, ali nove promene se neće sinhronizovati.",
      )
    )
      return;
    const res = await fetch("/api/google/disconnect", { method: "POST" });
    if (res.ok) window.location.reload();
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-medium inline-flex items-center gap-2">
          <Calendar className="size-4" strokeWidth={1.75} />
          Google Calendar
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sinhronizuj časove sa svojim Google Calendar-om — vidiš ih u GCal-u
          čim se kreiraju, automatski.
        </p>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Banner za status iz callback-a */}
        {bannerKind === "connected" && (
          <div className="rounded-md border border-emerald-300 bg-emerald-50 p-2.5 text-xs text-emerald-900 inline-flex items-center gap-1.5">
            <Check className="size-3.5" strokeWidth={2.5} />
            Uspešno povezano sa Google nalogom.
          </div>
        )}
        {bannerKind === "error" && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2.5 text-xs text-destructive inline-flex items-start gap-1.5">
            <AlertCircle className="size-3.5 mt-0.5 shrink-0" strokeWidth={1.75} />
            Greška: {bannerError ?? "nepoznato"}
          </div>
        )}

        {!connected ? (
          <div className="space-y-2">
            <p className="text-sm">
              Nije povezan. Klikni dugme da povežeš Google nalog —
              autorizacija ide preko zvaničnog Google consent screen-a.
            </p>
            <a
              href="/api/google/connect"
              className="inline-flex items-center gap-2 rounded-md bg-foreground text-background hover:opacity-90 text-sm h-9 px-4"
            >
              <Calendar className="size-3.5" strokeWidth={2} />
              Poveži Google Calendar
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm">
                Povezano sa{" "}
                <strong>{googleEmail ?? "Google nalogom"}</strong>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={disconnect}
              >
                <X className="size-3.5" strokeWidth={1.75} />
                Prekini vezu
              </Button>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Aktivan kalendar
              </p>
              {loadingCals ? (
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" strokeWidth={2} />
                  Učitavam kalendare...
                </p>
              ) : calendars ? (
                <div className="space-y-1.5">
                  {calendars.map((c) => {
                    const active = c.id === calendarId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCal(c.id, c.summary)}
                        disabled={pending}
                        className={`w-full text-left flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                          active
                            ? "border-foreground bg-secondary/40"
                            : "border-border hover:bg-secondary/30"
                        }`}
                      >
                        <span>
                          {c.summary}
                          {c.primary && (
                            <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                              primary
                            </span>
                          )}
                        </span>
                        {active && <Check className="size-3.5" strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-destructive">
                  Greška pri učitavanju kalendara.
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={createNew}
                disabled={pending}
                className="mt-2"
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                ) : (
                  <Plus className="size-3.5" strokeWidth={2} />
                )}
                Kreiraj nov kalendar „Profesori"
              </Button>
            </div>

            {actionError && (
              <p className="text-xs text-destructive">{actionError}</p>
            )}

            {calendarId && (
              <div className="text-xs text-muted-foreground pt-3 border-t border-border space-y-2">
                <p>
                  <strong className="text-foreground">Trenutni kalendar:</strong>{" "}
                  {calendarName ?? calendarId}
                </p>
                <p>
                  Sve nove izmene časova (kreiranje, pomeranje, otkazivanje)
                  iz Profesori app-a se automatski reflektuju u ovom Google
                  kalendaru.
                </p>
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-amber-900">
                  ⚠️ <strong>Važno:</strong> menjaj časove uvek u Profesori
                  app-u, ne direktno u Google Calendar-u. Promene koje
                  napraviš u GCal-u (otkazivanje, pomeranje) NEĆE se vratiti
                  u app, pa može doći do nesporazuma sa učenikom.
                </div>
              </div>
            )}

            <a
              href="https://calendar.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              Otvori Google Calendar
              <ExternalLink className="size-3" strokeWidth={1.75} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
