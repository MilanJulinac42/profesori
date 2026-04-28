"use client";

import { useActionState, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Trophy,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TopicInput } from "@/components/topic-input";
import { PhotoUpload } from "@/components/photo-upload";
import {
  COMMON_SUBJECTS,
  COMMON_LEVELS,
  COMMON_SPECIALTIES,
  COMMON_FORMATS,
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
  levels: string[];
  specialties: string[];
  formats: string[];
  years_experience: string | null;
  price_range_text: string | null;
  available_for_new_students: boolean;
  contact_email: string | null;
  photo_url: string | null;
  published: boolean;
};

export function ProfileForm({
  initial,
  organizationId,
}: {
  initial: InitialProfile | PublicProfile;
  organizationId: string;
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(
    savePublicProfile,
    undefined,
  );

  const [slug, setSlug] = useState(initial.slug);
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [bio, setBio] = useState(initial.bio ?? "");
  const [subjects, setSubjects] = useState<string[]>(initial.subjects ?? []);
  const [levels, setLevels] = useState<string[]>(initial.levels ?? []);
  const [specialties, setSpecialties] = useState<string[]>(
    initial.specialties ?? [],
  );
  const [formats, setFormats] = useState<string[]>(initial.formats ?? []);
  const [yearsExperience, setYearsExperience] = useState(
    initial.years_experience ?? "",
  );
  const [priceRange, setPriceRange] = useState(initial.price_range_text ?? "");
  const [contactEmail, setContactEmail] = useState(
    initial.contact_email ?? "",
  );
  const [photoUrl, setPhotoUrl] = useState(initial.photo_url ?? "");
  const [available, setAvailable] = useState(
    initial.available_for_new_students,
  );
  const [published, setPublished] = useState(initial.published);

  const saved =
    !pending && state !== undefined && !state.error && !state.fieldErrors;

  return (
    <form action={action} className="space-y-8">
      <Section title="Osnovno">
        <Field
          label="Slug (URL)"
          name="slug"
          value={slug}
          onChange={setSlug}
          required
          hint="Tvoj javni link je /p/{slug}. Mala slova, brojevi, crtice."
          error={state?.fieldErrors?.slug}
        />
        <Field
          label="Ime za prikaz"
          name="display_name"
          value={displayName}
          onChange={setDisplayName}
          required
          error={state?.fieldErrors?.display_name}
        />
        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm font-medium">
            Kratka biografija
          </Label>
          <Textarea
            id="bio"
            name="bio"
            rows={5}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ko si, koliko godina iskustva, čime se baviš..."
            className="text-sm"
          />
        </div>
        <Field
          label="Iskustvo"
          name="years_experience"
          value={yearsExperience}
          onChange={setYearsExperience}
          placeholder="npr. 5+ godina iskustva, profesor matematike u OŠ"
          hint="Kratka linija koja se prikazuje uz tvoje ime."
        />
        <div className="space-y-2">
          <Label className="text-sm font-medium">Fotografija</Label>
          <PhotoUpload
            orgId={organizationId}
            value={photoUrl}
            onChange={setPhotoUrl}
            fallbackName={displayName || "?"}
          />
          <input type="hidden" name="photo_url" value={photoUrl} />
        </div>
      </Section>

      <Section title="Šta predaješ" icon={BookOpen} accent="primary">
        <TagSection
          label="Predmeti"
          icon={BookOpen}
          accent="primary"
          value={subjects}
          onChange={setSubjects}
          suggestions={COMMON_SUBJECTS}
          placeholder="Dodaj predmet, pa Enter"
          name="subjects"
        />
        <TagSection
          label="Nivoi obrazovanja"
          icon={GraduationCap}
          accent="emerald"
          value={levels}
          onChange={setLevels}
          suggestions={COMMON_LEVELS}
          placeholder="Dodaj nivo (npr. Srednja)"
          name="levels"
        />
        <TagSection
          label="Specijalnosti / pripreme"
          icon={Trophy}
          accent="amber"
          value={specialties}
          onChange={setSpecialties}
          suggestions={COMMON_SPECIALTIES}
          placeholder="npr. Priprema za maturu"
          name="specialties"
        />
        <TagSection
          label="Format časova"
          icon={Monitor}
          accent="indigo"
          value={formats}
          onChange={setFormats}
          suggestions={COMMON_FORMATS}
          placeholder="npr. Online"
          name="formats"
        />
      </Section>

      <Section title="Cena i kontakt">
        <Field
          label="Cenovni raspon (slobodan tekst)"
          name="price_range_text"
          value={priceRange}
          onChange={setPriceRange}
          placeholder="npr. od 1500 RSD/čas"
        />
        <Field
          label="Email za kontakt (vidljiv na javnoj stranici)"
          name="contact_email"
          type="email"
          value={contactEmail}
          onChange={setContactEmail}
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
        {saved && (
          <span className="text-xs text-muted-foreground">Sačuvano.</span>
        )}
      </div>
    </form>
  );
}

const ACCENT_CLASSES: Record<
  "primary" | "emerald" | "amber" | "indigo",
  { icon: string; chipPreview: string }
> = {
  primary: {
    icon: "text-foreground",
    chipPreview:
      "bg-foreground text-background",
  },
  emerald: {
    icon: "text-emerald-600 dark:text-emerald-400",
    chipPreview:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  amber: {
    icon: "text-amber-600 dark:text-amber-400",
    chipPreview:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  indigo: {
    icon: "text-indigo-600 dark:text-indigo-400",
    chipPreview:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
};

function TagSection({
  label,
  icon: Icon,
  accent,
  value,
  onChange,
  suggestions,
  placeholder,
  name,
}: {
  label: string;
  icon: LucideIcon;
  accent: "primary" | "emerald" | "amber" | "indigo";
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  placeholder: string;
  name: string;
}) {
  const a = ACCENT_CLASSES[accent];
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium inline-flex items-center gap-2">
        <Icon className={cn("size-4", a.icon)} strokeWidth={1.75} />
        {label}
      </Label>
      <TopicInput
        value={value}
        onChange={onChange}
        suggestions={suggestions}
        placeholder={placeholder}
      />
      <input type="hidden" name={name} value={JSON.stringify(value)} />
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
          Pregled na javnom profilu:
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              a.chipPreview,
            )}
          >
            {value[0]}
          </span>
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  accent: _accent,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  accent?: "primary" | "emerald" | "amber" | "indigo";
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-5 pt-2">
      <legend className="text-base font-medium inline-flex items-center gap-2 mb-2">
        {Icon && <Icon className="size-4" strokeWidth={1.75} />}
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
  value,
  onChange,
  placeholder,
  required,
  error,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={!!error}
        className="h-10 text-sm"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
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
