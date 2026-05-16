"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Clock,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completeOnboardingAction,
  saveOnboardingDefaultsAction,
  createFirstStudentAction,
} from "@/lib/onboarding/actions";

const DURATION_PRESETS = [30, 45, 60, 90];
const STEPS = ["welcome", "defaults", "first-student"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingWizard({
  teacherName,
  initialPriceRsd,
  initialDuration,
}: {
  teacherName: string;
  initialPriceRsd: number;
  initialDuration: number;
}) {
  const [step, setStep] = useState<Step>("welcome");
  const [priceRsd, setPriceRsd] = useState<string>(String(initialPriceRsd));
  const [duration, setDuration] = useState<number>(initialDuration);
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const stepIdx = STEPS.indexOf(step);

  function finishOnboarding({
    redirectTo,
    createdStudentId,
  }: {
    redirectTo: string;
    createdStudentId?: string;
  }) {
    startTransition(async () => {
      const res = await completeOnboardingAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Prefer student's profile if we just created one, otherwise dashboard.
      router.push(createdStudentId ? `/students/${createdStudentId}` : redirectTo);
    });
  }

  function goToDefaults() {
    setError(null);
    setStep("defaults");
  }

  function saveDefaultsAndContinue() {
    setError(null);
    const priceNum = Number(priceRsd.replace(",", "."));
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Cena mora biti broj veći ili jednak 0.");
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0 || duration > 480) {
      setError("Trajanje mora biti 1-480 minuta.");
      return;
    }
    startTransition(async () => {
      const res = await saveOnboardingDefaultsAction({
        pricePara: Math.round(priceNum * 100),
        durationMinutes: Math.round(duration),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStep("first-student");
    });
  }

  function createStudent() {
    setError(null);
    if (!studentName.trim()) {
      setError("Ime učenika je obavezno.");
      return;
    }
    const priceNum = Number(priceRsd.replace(",", "."));
    startTransition(async () => {
      const res = await createFirstStudentAction({
        fullName: studentName,
        parentName,
        parentPhone,
        pricePara: Math.round(priceNum * 100),
        durationMinutes: Math.round(duration),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      finishOnboarding({
        redirectTo: "/dashboard",
        createdStudentId: res.studentId,
      });
    });
  }

  return (
    <div className="w-full max-w-md space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={
              i <= stepIdx
                ? "h-1 flex-1 rounded-full bg-brand"
                : "h-1 flex-1 rounded-full bg-secondary"
            }
          />
        ))}
      </div>

      <div className="card-elevated card-glow rounded-2xl p-6 space-y-5">
        {step === "welcome" && (
          <>
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl tile-cyan shrink-0">
                <Sparkles className="size-5" strokeWidth={2} />
              </span>
              <div>
                <h1 className="font-display text-2xl text-foreground tracking-tight">
                  Zdravo, {teacherName.split(" ")[0]}.
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Hajde da te postavim za par minuta. Postavićemo default cenu i
                  trajanje časa, pa ćeš moći da dodaš prvog učenika. Sve možeš
                  promeniti kasnije iz <strong>Podešavanja</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
              <SkipButton onSkip={() => finishOnboarding({ redirectTo: "/dashboard" })} disabled={pending} />
              <Button type="button" onClick={goToDefaults} disabled={pending}>
                Krenimo
                <ArrowRight className="size-3.5 ml-1" strokeWidth={2.25} />
              </Button>
            </div>
          </>
        )}

        {step === "defaults" && (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                Korak 2 od 3
              </p>
              <h1 className="font-display text-2xl text-foreground mt-1">
                Default cena i trajanje
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Većina tvojih časova će imati istu cenu i trajanje. Postavi ih
                jednom — predlaga se za svakog novog učenika.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Cena po času (RSD)</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="text"
                    inputMode="numeric"
                    value={priceRsd}
                    onChange={(e) => setPriceRsd(e.target.value)}
                    className="pr-12"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Banknote className="size-3.5" strokeWidth={1.75} />
                    RSD
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Trajanje časa (min)</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {DURATION_PRESETS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={
                        duration === d
                          ? "h-9 px-3 rounded-md bg-foreground text-background text-sm font-semibold"
                          : "h-9 px-3 rounded-md border border-border text-sm hover:bg-secondary"
                      }
                    >
                      {d} min
                    </button>
                  ))}
                  <Input
                    type="number"
                    min={1}
                    max={480}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5 pt-1">
                  <Clock className="size-3" strokeWidth={1.75} />
                  Standardno je 45 ili 60 min.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("welcome")}
                disabled={pending}
              >
                <ArrowLeft className="size-3.5 mr-1" strokeWidth={2} />
                Nazad
              </Button>
              <div className="flex items-center gap-2">
                <SkipButton onSkip={() => finishOnboarding({ redirectTo: "/dashboard" })} disabled={pending} />
                <Button
                  type="button"
                  onClick={saveDefaultsAndContinue}
                  disabled={pending}
                >
                  {pending ? (
                    <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    <>
                      Dalje
                      <ArrowRight className="size-3.5 ml-1" strokeWidth={2.25} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "first-student" && (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                Korak 3 od 3
              </p>
              <h1 className="font-display text-2xl text-foreground mt-1">
                Prvi učenik
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Dodaj jednog učenika sad — možeš ostale uvesti iz CSV-a kasnije.
                Sva polja sem imena su opciona.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="studentName">Ime učenika</Label>
                <Input
                  id="studentName"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="npr. Marko Petrović"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="parentName">Ime roditelja</Label>
                  <Input
                    id="parentName"
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="(opciono)"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parentPhone">Telefon roditelja</Label>
                  <Input
                    id="parentPhone"
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="+381…"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-secondary/40 px-3 py-2.5 text-[11px] text-muted-foreground inline-flex items-center gap-2">
                <Users className="size-3.5" strokeWidth={1.75} />
                Cena i trajanje će se primeniti iz prethodnog koraka — možeš ih
                promeniti kasnije na kartici učenika.
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("defaults")}
                disabled={pending}
              >
                <ArrowLeft className="size-3.5 mr-1" strokeWidth={2} />
                Nazad
              </Button>
              <div className="flex items-center gap-2">
                <SkipButton onSkip={() => finishOnboarding({ redirectTo: "/dashboard" })} disabled={pending} />
                <Button type="button" onClick={createStudent} disabled={pending}>
                  {pending ? (
                    <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    <>
                      <Check className="size-3.5 mr-1" strokeWidth={2.25} />
                      Dodaj i završi
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SkipButton({
  onSkip,
  disabled,
}: {
  onSkip: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSkip}
      disabled={disabled}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      <SkipForward className="size-3" strokeWidth={2} />
      Preskoči
    </button>
  );
}
