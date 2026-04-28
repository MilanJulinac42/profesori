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
import type { Student } from "@/lib/students/types";
import { parasToRsd } from "@/lib/money";
import { createStudent, updateStudent, type StudentFormState } from "@/lib/students/actions";

type Props =
  | { mode: "create"; student?: undefined }
  | { mode: "edit"; student: Student };

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
          <Field label="Škola" name="school" defaultValue={s?.school ?? ""} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status" className="text-xs">
            Status
          </Label>
          <Select name="status" defaultValue={s?.status ?? "active"}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktivan</SelectItem>
              <SelectItem value="paused">Pauziran</SelectItem>
              <SelectItem value="inactive">Neaktivan</SelectItem>
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
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
