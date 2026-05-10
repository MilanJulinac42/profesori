import { Sparkles, Wallet, CalendarDays } from "lucide-react";
import { Logo, LogoMark } from "@/components/layout/logo";

const FEATURES: {
  icon: typeof Sparkles;
  tile: "cyan" | "magenta" | "violet";
  title: string;
  description: string;
}[] = [
  {
    icon: CalendarDays,
    tile: "cyan",
    title: "Raspored & učenici",
    description: "Sve na jednom mestu — termini, beleške, kontakti.",
  },
  {
    icon: Wallet,
    tile: "magenta",
    title: "Naplata bez chaos-a",
    description: "Evidencija duga, podsetnici, automatski izveštaji.",
  },
  {
    icon: Sparkles,
    tile: "violet",
    title: "AI generator zadataka",
    description: "Generiši zadatke iz matematike u par sekundi.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 grid lg:grid-cols-[1fr_minmax(420px,520px)] min-h-screen">
      {/* Left brand panel — mesh gradient, premium first impression */}
      <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 border-r border-border/60 bg-hero-mesh relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
        />
        <div className="relative w-fit">
          <Logo />
        </div>

        <div className="relative space-y-8 max-w-md">
          <div className="space-y-3">
            <h2 className="font-display text-4xl xl:text-5xl text-foreground leading-[1.05]">
              Manje administracije,{" "}
              <em className="not-italic text-brand">više časova.</em>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Sve što ti treba za vođenje privatnih časova — učenici, raspored,
              naplata i AI generator zadataka. Na jednom mestu.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.title} className="flex items-start gap-3">
                  <div
                    className={`flex size-9 items-center justify-center rounded-xl tile-${f.tile} shrink-0 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset] mt-0.5`}
                  >
                    <Icon className="size-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {f.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} Profesori
        </p>
      </div>

      {/* Right form */}
      <div className="flex flex-col bg-background">
        <div className="lg:hidden flex items-center px-6 h-14 border-b border-border">
          <Logo />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex justify-center mb-8">
              <LogoMark className="size-10" />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
