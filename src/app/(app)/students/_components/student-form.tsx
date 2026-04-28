"use client";

import Link from "next/link";
import { useActionState } from "react";
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
import {
  EDUCATION_LABELS,
  EDUCATION_OPTIONS,
  STATUS_LABELS,
  type Student,
  type StudentStatus,
} from "@/lib/students/types";
import { parasToRsd } from "@/lib/money";
import { createStudent, updateStudent, type StudentFormState } from "@/lib/students/actions";

type Props =
  | { mode: "create"; student?: undefined }
  | { mode: "edit"; student: Student };

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active", label: STATUS_LABELS.active },
  { value: "paused", label: STATUS_LABELS.paused },
  { value: "inactive", label: STATUS_LABELS.inactive },
];

/** Translate native browser validation messages into Serbian. */
function localizeValidation(input: HTMLInputElement, customMessage?: string) {
  const v = input.validity;
  if (v.valid) {
    input.setCustomValidity("");
    return;
  }
  if (v.valueMissing) input.setCustomValidity("Ovo polje je obavezno.");
  else if (v.typeMismatch && input.type === "email")
    input.setCustomValidity("Unesi ispravan email (mora sadržati @).");
  else if (v.typeMismatch) input.setCustomValidity("Unesi ispravan format.");
  else if (v.patternMismatch) input.setCustomValidity(customMessage ?? "Format nije ispravan.");
  else if (v.tooShort)
    input.setCustomValidity(`Najmanje ${input.minLength} karaktera.`);
  else if (v.tooLong)
    input.setCustomValidity(`Najviše ${input.maxLength} karaktera.`);
  else if (v.rangeUnderflow) input.setCustomValidity(`Najmanje ${input.min}.`);
  else if (v.rangeOverflow) input.setCustomValidity(`Najviše ${input.max}.`);
  else input.setCustomValidity("Vrednost nije ispravna.");
}

export function StudentForm(props: Props) {
  const action =
    props.mode === "create"
      ? createStudent
      : updateStudent.bind(null, props.student.id);

  const [state, formAction, pending] = useActionState<StudentFormState, FormData>(
    action,
    undefined,
  );

  const s = props.student;
  const submitLabel =
    props.mode === "create" ? "Sačuvaj učenika" : "Sačuvaj izmene";

  return (
    <form action={formAction} className="space-y-8 max-w-2xl">
      <Section title="Osnovni podaci">
        <Field
          label="Ime i prezime"
          name="full_name"
          defaultValue={s?.full_name}
          required
          autoFocus
          error={state?.fieldErrors?.full_name}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Razred"
            name="grade"
            placeholder="npr. 8. razred OŠ"
            defaultValue={s?.grade ?? ""}
          />
          <div className="space-y-1.5">
            <Label htmlFor="school" className="text-xs">
              Obrazovanje
            </Label>
            <Select name="school" defaultValue={s?.school ?? undefined}>
              <SelectTrigger id="school" className="w-full">
                <SelectValue placeholder="Izaberi nivo">
                  {(value: string) =>
                    EDUCATION_LABELS[value as keyof typeof EDUCATION_LABELS] ??
                    "Izaberi nivo"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status" className="text-xs">
            Status
          </Label>
          <Select name="status" defaultValue={s?.status ?? "active"}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue>
                {(value: string) =>
                  STATUS_LABELS[value as StudentStatus] ?? "Status"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section title="Kontakt roditelja">
        <Field label="Ime roditelja" name="parent_name" defaultValue={s?.parent_name ?? ""} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Telefon"
            name="parent_phone"
            type="tel"
            defaultValue={s?.parent_phone ?? ""}
          />
          <Field
            label="Email"
            name="parent_email"
            type="email"
            defaultValue={s?.parent_email ?? ""}
          />
        </div>
      </Section>

      <Section title="Naplata">
        <Field
          label="Cena po času (RSD)"
          name="default_price_per_lesson"
          type="text"
          inputMode="numeric"
          placeholder="1500"
          defaultValue={
            s?.default_price_per_lesson
              ? String(parasToRsd(s.default_price_per_lesson))
              : ""
          }
          error={state?.fieldErrors?.default_price_per_lesson}
          hint="Default cena za nove časove. Možeš je promeniti pojedinačno."
        />
      </Section>

      <Section title="Dodatno">
        <Field
          label="Tagovi"
          name="tags"
          placeholder="npr. priprema_za_prijemni, dolazi_kuci"
          defaultValue={s?.tags?.join(", ") ?? ""}
          hint="Razdvoji zarezima."
        />
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs">
            Beleške
          </Label>
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={s?.notes ?? ""}
            placeholder="Bilo šta korisno o učeniku — stil učenja, posebne potrebe, šta voli..."
          />
        </div>
      </Section>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Čuvanje..." : submitLabel}
        </Button>
        <Link
          href={s ? `/students/${s.id}` : "/students"}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Otkaži
        </Link>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  autoFocus,
  inputMode,
  error,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  inputMode?: "numeric" | "tel" | "email";
  error?: string;
  hint?: string;
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
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        inputMode={inputMode}
        aria-invalid={!!error}
        onInvalid={(e) => localizeValidation(e.currentTarget)}
        onInput={(e) => e.currentTarget.setCustomValidity("")}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
