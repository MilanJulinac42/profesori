"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  updateOrgSettings,
  type FormState,
} from "@/lib/settings/actions";
import {
  DEFAULT_REMINDER_TEMPLATE,
  TEMPLATE_PLACEHOLDERS,
  type OrgSettings,
} from "@/lib/settings/types";
import { parasToRsd } from "@/lib/money";
import { cn } from "@/lib/utils";

export function OrgSettingsForm({
  initial,
}: {
  initial: OrgSettings;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateOrgSettings,
    undefined,
  );

  const [price, setPrice] = useState(
    initial.default_price_per_lesson
      ? String(parasToRsd(initial.default_price_per_lesson))
      : "",
  );
  const [duration, setDuration] = useState(
    String(initial.default_lesson_duration_minutes ?? 60),
  );
  const [chargeStudent, setChargeStudent] = useState(
    initial.charge_for_cancelled_by_student ?? true,
  );
  const [chargeNoShow, setChargeNoShow] = useState(
    initial.charge_for_no_show ?? true,
  );
  const [reminderTemplate, setReminderTemplate] = useState(
    initial.reminder_template ?? "",
  );
  const [autoReminders, setAutoReminders] = useState(
    initial.send_automatic_reminders ?? false,
  );

  const saved =
    !pending && state !== undefined && !state.error && !state.fieldErrors;

  return (
    <form action={action} className="space-y-6">
      {/* Defaults */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-medium">Default vrednosti</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pretpostavljena cena i trajanje za novog učenika. Po učeniku možeš
            kasnije promeniti.
          </p>
        </div>
        <div className="px-5 py-5 grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="default_price_per_lesson" className="text-sm font-medium">
              Default cena (RSD)
            </Label>
            <Input
              id="default_price_per_lesson"
              name="default_price_per_lesson"
              type="text"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="2500"
              className="h-10 text-sm tabular-nums"
              aria-invalid={!!state?.fieldErrors?.default_price_per_lesson}
            />
            {state?.fieldErrors?.default_price_per_lesson && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.default_price_per_lesson}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="default_lesson_duration_minutes"
              className="text-sm font-medium"
            >
              Default trajanje (min)
            </Label>
            <Input
              id="default_lesson_duration_minutes"
              name="default_lesson_duration_minutes"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
              min={1}
              max={480}
              className="h-10 text-sm tabular-nums"
              aria-invalid={
                !!state?.fieldErrors?.default_lesson_duration_minutes
              }
            />
            {state?.fieldErrors?.default_lesson_duration_minutes && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.default_lesson_duration_minutes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation behavior */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-medium">Naplata otkazanih časova</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kako tretirati otkazane časove kad računaš dug učenika.
          </p>
        </div>
        <div className="px-5 py-5 space-y-4">
          <Toggle
            name="charge_for_cancelled_by_student"
            checked={chargeStudent}
            onChange={setChargeStudent}
            label="Naplaćuj kad učenik otkaže"
            hint="Standardno se naplaćuje. Profesor je rezervisao termin koji je propušten."
          />
          <Toggle
            name="charge_for_no_show"
            checked={chargeNoShow}
            onChange={setChargeNoShow}
            label="Naplaćuj 'Nije se pojavio'"
            hint="No-show je standardno naplativ — učenik ni nije obavestio."
          />
          <p className="text-[11px] text-muted-foreground italic">
            Napomena: trenutno se ova podešavanja čuvaju u bazi, ali logika
            naplate ih još ne čita. Aktiviraćemo u sledećoj iteraciji — za sad
            informativno.
          </p>
        </div>
      </div>

      {/* Reminder template */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-medium">Tekst opomene</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Custom šablon koji se popunjava kad pošalješ opomenu. Ostavi prazno
            za default.
          </p>
        </div>
        <div className="px-5 py-5 space-y-3">
          <Textarea
            name="reminder_template"
            rows={10}
            value={reminderTemplate}
            onChange={(e) => setReminderTemplate(e.target.value)}
            placeholder={DEFAULT_REMINDER_TEMPLATE}
            className="text-sm font-mono"
          />
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              Dostupni placeholder-i (klikni da se ubaci):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_PLACEHOLDERS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() =>
                    setReminderTemplate((s) => (s ? s + " " : "") + p.key)
                  }
                  title={p.desc}
                  className="text-[11px] font-mono rounded-md border border-border bg-card hover:bg-secondary px-2 py-0.5"
                >
                  {p.key}
                </button>
              ))}
            </div>
          </div>
          <Toggle
            name="send_automatic_reminders"
            checked={autoReminders}
            onChange={setAutoReminders}
            label="Automatski email-podsetnici roditeljima pre časa"
            hint="Šalje email 24h i 2h pre časa. Aktiviraćemo kad uvedemo Resend integraciju."
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 sticky bottom-0 -mx-4 sm:-mx-0 px-4 sm:px-0 py-3 bg-background/80 backdrop-blur-md border-t border-border">
        <Button type="submit" disabled={pending}>
          {pending ? "Čuvanje..." : "Sačuvaj"}
        </Button>
        {saved && (
          <span className="text-xs text-muted-foreground">Sačuvano.</span>
        )}
      </div>
    </form>
  );
}

function Toggle({
  name,
  checked,
  onChange,
  label,
  hint,
}: {
  name: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="hidden" name={name} value={checked ? "on" : "off"} />
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-foreground" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-background transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {hint && (
          <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
        )}
      </div>
    </label>
  );
}
