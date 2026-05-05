"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Sparkles, Loader2, Check, Pencil } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  generateExerciseSetAction,
  saveExerciseSetAction,
  type GenerateFormState,
} from "@/lib/exercises/actions";
import {
  COUNT_OPTIONS,
  DIFFICULTY_LABELS,
  DIFFICULTY_OPTIONS,
  GRADE_PRESETS,
} from "@/lib/exercises/types";

export function GeneratorWizard() {
  const [state, formAction, pending] = useActionState<
    GenerateFormState,
    FormData
  >(generateExerciseSetAction, undefined);

  if (state?.preview) {
    return <Preview preview={state.preview} />;
  }

  return <ParamsForm state={state} formAction={formAction} pending={pending} />;
}

/* ---------- step 1: parametri ---------- */

function ParamsForm({
  state,
  formAction,
  pending,
}: {
  state: GenerateFormState;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-border bg-card p-6">
      <div className="space-y-1.5">
        <Label htmlFor="grade_level" className="text-xs">
          Razred / nivo <span className="text-destructive">*</span>
        </Label>
        <Input
          id="grade_level"
          name="grade_level"
          placeholder="npr. 8. razred OŠ"
          list="grade-presets"
          required
          aria-invalid={!!state?.fieldErrors?.grade_level}
        />
        <datalist id="grade-presets">
          {GRADE_PRESETS.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        {state?.fieldErrors?.grade_level && (
          <p className="text-xs text-destructive">{state.fieldErrors.grade_level}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="topic" className="text-xs">
          Tema <span className="text-destructive">*</span>
        </Label>
        <Input
          id="topic"
          name="topic"
          placeholder="npr. Kvadratne jednačine, Pitagorina teorema, Razlomci"
          required
          aria-invalid={!!state?.fieldErrors?.topic}
        />
        {state?.fieldErrors?.topic && (
          <p className="text-xs text-destructive">{state.fieldErrors.topic}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Što preciznija tema, to bolji zadaci. Možeš da budeš i konkretan: &quot;Sabiranje razlomaka različitih imenilaca&quot;.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="difficulty" className="text-xs">
            Težina <span className="text-destructive">*</span>
          </Label>
          <Select name="difficulty" defaultValue="srednje">
            <SelectTrigger id="difficulty" className="w-full">
              <SelectValue>
                {(value: string) =>
                  DIFFICULTY_LABELS[value as keyof typeof DIFFICULTY_LABELS] ??
                  "Težina"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="count" className="text-xs">
            Broj zadataka <span className="text-destructive">*</span>
          </Label>
          <Select name="count" defaultValue="10">
            <SelectTrigger id="count" className="w-full">
              <SelectValue>{(v: string) => v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COUNT_OPTIONS.map((c) => (
                <SelectItem key={c} value={String(c)}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="teacher_notes" className="text-xs">
          Napomena (opciono)
        </Label>
        <Textarea
          id="teacher_notes"
          name="teacher_notes"
          rows={3}
          placeholder='npr. "Bez decimalnih brojeva", "Fokus na faktorisanje", "Po tipu prijemnog za matematičku gimnaziju"'
        />
        <p className="text-xs text-muted-foreground">
          Sve što je specifično za tvoj kontekst — model će striktno poštovati.
        </p>
      </div>

      {state?.error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              Generišem... (10-20s)
            </>
          ) : (
            <>
              <Sparkles className="size-4" strokeWidth={2} />
              Generiši zadatke
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          AI piše zadatke, rešenja i objašnjenja.
        </p>
      </div>
    </form>
  );
}

/* ---------- step 2: preview ---------- */

function Preview({
  preview,
}: {
  preview: NonNullable<GenerateFormState>["preview"];
}) {
  if (!preview) return null;

  const payload = JSON.stringify(preview);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-medium leading-snug">{preview.title}</h2>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="outline" className="font-normal text-[10px]">
                {DIFFICULTY_LABELS[preview.difficulty]}
              </Badge>
              <span>·</span>
              <span>{preview.gradeLevel}</span>
              <span>·</span>
              <span>{preview.exercises.length} zadataka</span>
            </div>
          </div>
        </div>

        {preview.teacherNotes && (
          <p className="text-xs text-muted-foreground border-l-2 border-border pl-3 italic">
            Napomena: {preview.teacherNotes}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <form action={saveExerciseSetAction}>
            <input type="hidden" name="payload" value={payload} />
            <Button type="submit">
              <Check className="size-4" strokeWidth={2} />
              Sačuvaj u banku
            </Button>
          </form>
          <Link
            href="/exercises/new"
            className={buttonVariants({ variant: "outline" })}
          >
            <Pencil className="size-4" strokeWidth={2} />
            Promeni parametre
          </Link>
        </div>
      </div>

      <ol className="space-y-3">
        {preview.exercises.map((ex, i) => (
          <li
            key={i}
            className="rounded-xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-medium tabular-nums text-muted-foreground shrink-0">
                {i + 1}.
              </span>
              <p className="text-sm whitespace-pre-wrap leading-relaxed flex-1 min-w-0">
                {ex.question}
              </p>
            </div>
            <div className="pl-7 space-y-2">
              <div className="rounded-md bg-secondary/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Rešenje
                </p>
                <p className="text-sm whitespace-pre-wrap font-medium">
                  {ex.solution}
                </p>
              </div>
              <details className="group">
                <summary className="text-xs text-muted-foreground hover:text-foreground cursor-pointer list-none inline-flex items-center gap-1">
                  <span className="group-open:hidden">Prikaži postupak</span>
                  <span className="hidden group-open:inline">Sakrij postupak</span>
                </summary>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mt-2">
                  {ex.explanation}
                </p>
              </details>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
