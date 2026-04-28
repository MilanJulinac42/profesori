"use client";

import { useActionState } from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitBooking, type BookingFormState } from "@/lib/booking/actions";

export function BookingForm({
  organizationId,
  defaultSubjects,
}: {
  organizationId: string;
  defaultSubjects: string[];
}) {
  const [state, action, pending] = useActionState<BookingFormState, FormData>(
    submitBooking.bind(null, organizationId),
    undefined,
  );

  if (state?.success) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-2">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-foreground text-background">
          <Check className="size-5" strokeWidth={2.5} />
        </div>
        <h3 className="text-base font-medium">Upit je poslat.</h3>
        <p className="text-sm text-muted-foreground">
          Profesor će ti se javiti uskoro.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <FormField
          label="Tvoje ime"
          name="parent_name"
          required
          autoComplete="name"
          error={state?.fieldErrors?.parent_name}
        />
        <FormField
          label="Razred deteta"
          name="student_grade"
          placeholder="npr. 8. razred OŠ"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <FormField
          label="Telefon"
          name="parent_phone"
          type="tel"
          autoComplete="tel"
        />
        <FormField
          label="Email"
          name="parent_email"
          type="email"
          autoComplete="email"
          error={state?.fieldErrors?.parent_email}
        />
      </div>

      {defaultSubjects.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="subject" className="text-xs">
            Predmet
          </Label>
          <Select name="subject" defaultValue={defaultSubjects[0]}>
            <SelectTrigger id="subject" className="w-full">
              <SelectValue>
                {(value: string | null) => value ?? "Izaberi predmet"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {defaultSubjects.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="message" className="text-xs">
          Poruka
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Šta dete želi da uči, koji je cilj, postojeći nivo znanja..."
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? (
            "Slanje..."
          ) : (
            <>
              <Send className="size-3.5" strokeWidth={2} />
              Pošalji upit
            </>
          )}
        </Button>
        <p className="text-[11px] text-muted-foreground mt-2">
          Poruka ide direktno profesoru. Bez naloga, bez plaćanja.
        </p>
      </div>
    </form>
  );
}

function FormField({
  label,
  name,
  type = "text",
  required,
  placeholder,
  autoComplete,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
