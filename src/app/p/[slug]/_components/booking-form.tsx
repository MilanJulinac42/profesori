"use client";

import { useActionState } from "react";
import { Check, Send, ArrowRight } from "lucide-react";
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
      <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-3">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <Check className="size-6" strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-medium tracking-tight">Upit je poslat.</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Profesor će ti se javiti uskoro. Možeš zatvoriti stranicu.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField
          label="Tvoje ime"
          name="parent_name"
          required
          autoComplete="name"
          placeholder="Marija Petrović"
          error={state?.fieldErrors?.parent_name}
        />
        <FormField
          label="Razred deteta"
          name="student_grade"
          placeholder="npr. 8. razred OŠ"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField
          label="Telefon"
          name="parent_phone"
          type="tel"
          autoComplete="tel"
          placeholder="+381 ..."
        />
        <FormField
          label="Email"
          name="parent_email"
          type="email"
          autoComplete="email"
          placeholder="ime@email.com"
          error={state?.fieldErrors?.parent_email}
        />
      </div>

      {defaultSubjects.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-sm font-medium">
            Predmet
          </Label>
          <Select name="subject" defaultValue={defaultSubjects[0]}>
            <SelectTrigger id="subject" className="w-full h-11 text-sm">
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

      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium">
          Šta dete želi da uči?
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Cilj učenja, postojeći nivo, kada vam odgovara..."
          className="text-sm"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="pt-2 flex flex-col items-center gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="w-full sm:w-auto sm:px-8 h-12 text-sm font-medium"
        >
          {pending ? (
            "Slanje..."
          ) : (
            <>
              <Send className="size-4" strokeWidth={2} />
              Pošalji upit
              <ArrowRight className="size-4" strokeWidth={2} />
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Bez naloga, bez plaćanja. Poruka ide direktno profesoru.
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
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium">
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
        className="h-11 text-sm"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
