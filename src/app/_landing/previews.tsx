import { Sparkles, Send, Star, Bot, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   Preview Card primitive — frosted glass with deep shadow
   ============================================================ */

export function PreviewCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card/90 backdrop-blur-md shadow-[0_24px_64px_-16px_oklch(0_0_0/0.5),0_0_0_1px_oklch(1_0_0/0.04)_inset]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ============================================================
   AI Asistent preview — chat bubbles
   ============================================================ */

export function AIAsistentPreview() {
  return (
    <div
      aria-hidden
      className="relative w-full max-w-md mx-auto select-none pointer-events-none"
      style={{ perspective: "1200px" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 -m-8 rounded-[40px] blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 30% 30%, oklch(0.65 0.22 285 / 0.4), transparent 70%), radial-gradient(ellipse 60% 60% at 80% 80%, oklch(0.78 0.16 205 / 0.3), transparent 70%)",
        }}
      />
      <PreviewCard
        className="relative p-4 space-y-3"
        // small tilt for visual interest
      >
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <div className="flex size-8 items-center justify-center rounded-xl tile-violet shrink-0">
            <Bot className="size-4" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">AI Asistent</p>
            <p className="text-[10px] text-muted-foreground">Online</p>
          </div>
        </div>

        <div className="space-y-2.5">
          <ChatBubble role="user">
            Koji učenici nisu predali poslednji domaći?
          </ChatBubble>
          <ChatBubble role="ai">
            3 učenika nisu predala:
            <br />
            • Marko P. — Kvadratne jednačine
            <br />
            • Stefan K. — Diskriminanta
            <br />• Lana M. — Vietove formule
          </ChatBubble>
          <ChatBubble role="user">
            Zakazi Markov sledeci cas utorak 17h, 60 min
          </ChatBubble>
          <ChatBubble role="ai" proposal>
            <div className="space-y-1.5">
              <p className="font-semibold">Predlažem:</p>
              <p className="text-[11px] opacity-90">
                📅 Utorak, 14. maj · 17:00
                <br />
                👤 Marko Petrović · 60 min
                <br />
                📚 Priprema za malu maturu
              </p>
              <div className="flex gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 bg-brand text-brand-foreground text-[10px] font-semibold">
                  <CheckCircle2 className="size-2.5" strokeWidth={2.5} />
                  Potvrdi
                </span>
                <span className="inline-flex items-center rounded-md px-2 py-0.5 bg-secondary text-muted-foreground text-[10px] font-semibold">
                  Otkaži
                </span>
              </div>
            </div>
          </ChatBubble>
        </div>
      </PreviewCard>
    </div>
  );
}

function ChatBubble({
  role,
  proposal,
  children,
}: {
  role: "user" | "ai";
  proposal?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex",
        role === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-[11px] leading-relaxed",
          role === "user"
            ? "bg-foreground text-background"
            : proposal
              ? "bg-brand/15 dark:bg-brand/20 border border-brand/30 text-foreground"
              : "bg-secondary text-foreground/90",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   Public Profile preview — magazinski profil
   ============================================================ */

export function PublicProfilePreview() {
  return (
    <div
      aria-hidden
      className="relative w-full max-w-md mx-auto select-none pointer-events-none"
      style={{ perspective: "1200px" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 -m-8 rounded-[40px] blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 30% 30%, oklch(0.7 0.27 340 / 0.35), transparent 70%), radial-gradient(ellipse 60% 60% at 80% 80%, oklch(0.78 0.16 205 / 0.3), transparent 70%)",
        }}
      />
      <PreviewCard className="relative overflow-hidden">
        {/* Mini hero */}
        <div
          className="relative px-4 py-5"
          style={{
            backgroundImage:
              "radial-gradient(55% 70% at 8% 10%, oklch(0.65 0.26 220 / 0.18), transparent 55%), radial-gradient(45% 60% at 95% 0%, oklch(0.7 0.27 340 / 0.14), transparent 60%), linear-gradient(155deg, oklch(0.2 0.04 268), oklch(0.17 0.04 268))",
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="inline-flex size-12 items-center justify-center rounded-full text-sm font-bold text-white shrink-0"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, oklch(0.78 0.16 205), oklch(0.7 0.27 340))",
              }}
            >
              MJ
            </span>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                Privatni profesor
              </p>
              <h3 className="font-display text-xl text-foreground leading-tight mt-0.5">
                Milan Julinac
              </h3>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold tile-emerald">
              <span className="size-1 rounded-full bg-emerald-500" />
              Prima nove
            </span>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold tile-amber">
              <Sparkles className="size-2 fill-current" strokeWidth={2} />
              8+ godina iskustva
            </span>
          </div>
        </div>

        {/* Mini sections */}
        <div className="p-4 space-y-3 border-t border-border/60">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-muted-foreground mb-1.5">
              01 / Šta predajem
            </p>
            <div className="flex flex-wrap gap-1">
              {["Matematika", "Fizika", "Informatika"].map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold tile-cyan"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-muted-foreground mb-1.5">
              02 / Preporuke
            </p>
            <div className="flex items-start gap-1.5 text-[10px]">
              <div className="flex gap-0.5 mt-0.5 shrink-0">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className="size-2 fill-amber-400 text-amber-400"
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <p className="text-foreground/80 italic leading-snug">
                „Marko je za 3 meseca podigao ocenu sa 3 na 5"
              </p>
            </div>
          </div>

          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-foreground text-background text-[11px] font-semibold"
          >
            <Send className="size-3" strokeWidth={2.25} />
            Pošalji upit
          </button>
        </div>
      </PreviewCard>
    </div>
  );
}

/* ============================================================
   Parent Portal preview
   ============================================================ */

export function ParentPortalPreview() {
  return (
    <div
      aria-hidden
      className="relative w-full max-w-md mx-auto select-none pointer-events-none"
      style={{ perspective: "1200px" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 -m-8 rounded-[40px] blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 30% 30%, oklch(0.7 0.2 150 / 0.35), transparent 70%), radial-gradient(ellipse 60% 60% at 80% 80%, oklch(0.78 0.16 205 / 0.3), transparent 70%)",
        }}
      />
      <PreviewCard className="relative overflow-hidden">
        {/* Hero */}
        <div className="p-4 bg-hero-mesh">
          <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-muted-foreground mb-1">
            Roditeljski portal
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span
              className="inline-flex size-11 items-center justify-center rounded-full text-sm font-bold text-white shrink-0"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, oklch(0.78 0.16 205), oklch(0.65 0.22 240))",
              }}
            >
              MP
            </span>
            <div>
              <h3 className="font-display text-xl text-foreground leading-tight">
                Marko Petrović
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Profesor <span className="font-semibold text-foreground/90">Milan Julinac</span>
              </p>
            </div>
          </div>
        </div>

        {/* Progress + next lesson row */}
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
          <div className="p-3">
            <p className="text-[9px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
              Napredak
            </p>
            <p className="font-display text-xl text-foreground tabular-nums leading-none mt-1">
              82%
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">
              odličan napredak
            </p>
          </div>
          <div className="p-3">
            <p className="text-[9px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
              Sledeći čas
            </p>
            <p className="text-[11px] font-semibold text-foreground mt-1">
              Utorak, 14. maj
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5 tabular-nums">
              17:00 · 60 min
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 p-3 border-t border-border">
          <MiniStat label="Časova" value="34" tile="cyan" />
          <MiniStat label="Ocena" value="4.6" tile="amber" />
          <MiniStat label="Domaćih" value="12" tile="emerald" />
        </div>

        {/* Recent lesson preview */}
        <div className="p-3 border-t border-border">
          <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-muted-foreground mb-2">
            Šta smo radili
          </p>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] text-muted-foreground font-medium">
              sreda, 8. maj
            </p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={cn(
                    "size-2",
                    n <= 4
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30",
                  )}
                  strokeWidth={1.5}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold tile-cyan">
              Kvadratne jednačine
            </span>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold tile-cyan">
              Vietove formule
            </span>
          </div>
        </div>
      </PreviewCard>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tile,
}: {
  label: string;
  value: string;
  tile: "cyan" | "amber" | "emerald";
}) {
  return (
    <div className="rounded-lg border border-border/60 p-2">
      <p className="text-[8px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center justify-between mt-1">
        <span className="font-display text-base text-foreground tabular-nums leading-none">
          {value}
        </span>
        <div
          className={cn(
            "flex size-5 items-center justify-center rounded-md shrink-0",
            `tile-${tile}`,
          )}
        >
          {tile === "cyan" && <CheckCircle2 className="size-2.5" strokeWidth={2.5} />}
          {tile === "amber" && <Star className="size-2.5 fill-current" strokeWidth={2.5} />}
          {tile === "emerald" && <CheckCircle2 className="size-2.5" strokeWidth={2.5} />}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   AI Exercise Generator preview — math problems
   ============================================================ */

export function ExercisePreview() {
  return (
    <div
      aria-hidden
      className="relative w-full max-w-md mx-auto select-none pointer-events-none"
      style={{ perspective: "1200px" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 -m-8 rounded-[40px] blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 30% 30%, oklch(0.7 0.27 340 / 0.35), transparent 70%), radial-gradient(ellipse 60% 60% at 80% 80%, oklch(0.65 0.22 285 / 0.3), transparent 70%)",
        }}
      />
      <PreviewCard className="relative p-4 space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-border/60">
          <div className="flex size-8 items-center justify-center rounded-xl tile-magenta shrink-0">
            <Sparkles className="size-4" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">
              Kvadratne jednačine
            </p>
            <p className="text-[10px] text-muted-foreground">
              8. razred OŠ · 10 zadataka
            </p>
          </div>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold tile-amber">
            srednje
          </span>
        </div>

        <ExerciseRow
          num={1}
          question="Reši jednačinu: x² − 5x + 6 = 0"
          solution="x₁ = 2, x₂ = 3"
        />
        <ExerciseRow
          num={2}
          question="Odredi diskriminantu: 2x² + 3x − 5 = 0"
          solution="D = 49"
        />
        <ExerciseRow
          num={3}
          question="Vietova formula: x² + bx + c = 0, x₁ + x₂ = −7, x₁·x₂ = 12"
          solution="b = 7, c = 12"
        />

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>+ 7 zadataka</span>
          <span className="text-foreground font-semibold">PDF eksport →</span>
        </div>
      </PreviewCard>
    </div>
  );
}

function ExerciseRow({
  num,
  question,
  solution,
}: {
  num: number;
  question: string;
  solution: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-semibold tabular-nums text-muted-foreground shrink-0 mt-0.5">
          {num}.
        </span>
        <p className="text-[11px] text-foreground/90 leading-snug font-medium">
          {question}
        </p>
      </div>
      <div className="ml-5 flex items-center gap-1.5">
        <span className="text-[8px] uppercase tracking-[0.14em] font-semibold text-emerald-500 dark:text-emerald-400 shrink-0">
          Rešenje
        </span>
        <span className="text-[10px] font-mono text-foreground/80">
          {solution}
        </span>
      </div>
    </div>
  );
}
