"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TopicInput } from "@/components/topic-input";
import {
  COMMON_SUBJECTS,
  type PublicProfile,
} from "@/lib/public-profile/types";
import {
  savePublicProfile,
  type ProfileFormState,
} from "@/lib/public-profile/actions";
import { cn } from "@/lib/utils";

type InitialProfile = {
  slug: string;
  display_name: string;
  bio: string | null;
  subjects: string[];
  price_range_text: string | null;
  available_for_new_students: boolean;
  contact_email: string | null;
  photo_url: string | null;
  published: boolean;
};

export function ProfileForm({
  initial,
}: {
  initial: InitialProfile | PublicProfile;
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(
    savePublicProfile,
    undefined,
  );

  const [subjects, setSubjects] = useState<string[]>(initial.subjects ?? []);
  const [available, setAvailable] = useState(
    initial.available_for_new_students,
  );
  const [published, setPublished] = useState(initial.published);

  return (
    <form action={action} className="space-y-8">
      <Section title="Osnovno">
        <Field
          label="Slug (URL)"
          name="slug"
          defaultValue={initial.slug}
          required
          hint="Tvoj javni link je /p/{slug}. Mala slova, brojevi, crtice."
          error={state?.fieldErrors?.slug}
        />
        <Field
          label="Ime za prikaz"
          name="display_name"
          defaultValue={initial.display_name}
          required
          error={state?.fieldErrors?.display_name}
        />
        <div className="space-y-1.5">
          <Label htmlFor="bio" className="text-xs">
            Kratka biografija
          </Label>
          <Textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={initial.bio ?? ""}
            placeholder="Ko si, koliko godina iskustva, čime se baviš..."
          />
        </div>
        <Field
          label="URL slike"
          name="photo_url"
          type="url"
          defaultValue={initial.photo_url ?? ""}
          placeholder="https://..."
          hint="Direktan link do tvoje fotografije (npr. iz Google Drive-a sa public sharing-om)."
        />
      </Section>

      <Section title="Predmeti i cena">
        <div className="space-y-1.5">
          <Label className="text-xs">Predmeti koje predaješ</Label>
          <TopicInput
            value={subjects}
            onChange={setSubjects}
            suggestions={COMMON_SUBJECTS}
            placeholder="Dodaj predmet, pa Enter"
          />
          <input
            type="hidden"
            name="subjects"
            value={JSON.stringify(subjects)}
          />
        </div>
        <Field
          label="Cenovni raspon (slobodan tekst)"
          name="price_range_text"
          defaultValue={initial.price_range_text ?? ""}
          placeholder="npr. od 1500 RSD/čas"
        />
        <Field
          label="Email za kontakt (vidljiv na javnoj stranici)"
          name="contact_email"
          type="email"
          defaultValue={initial.contact_email ?? ""}
        />
      </Section>

      <Section title="Vidljivost">
        <Toggle
          name="available_for_new_students"
          checked={available}
          onChange={setAvailable}
          label="Primam nove učenike"
          hint="Ako je isključeno, na profilu se prikazuje napomena."
        />
        <Toggle
          name="published"
          checked={published}
          onChange={setPublished}
          label="Objavi profil"
          hint="Kad je uključeno, javni link radi i forma za upite je aktivna."
        />
      </Section>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Čuvanje..." : "Sačuvaj"}
        </Button>
        {!pending && state && !state.error && !state.fieldErrors && (
          <span className="text-xs text-muted-foreground">Sačuvano.</span>
        )}
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
  error,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
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
        aria-invalid={!!error}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && hint && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
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
      <input
        type="hidden"
        name={name}
        value={checked ? "on" : "off"}
      />
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-foreground" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-background transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
      <div className="flex-1">
        <p className="text-sm">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </label>
  );
}
