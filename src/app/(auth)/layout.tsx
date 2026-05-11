import { Logo } from "@/components/layout/logo";
import { AuthPreview } from "./_components/auth-preview";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 grid lg:grid-cols-[1fr_minmax(420px,520px)] min-h-screen">
      {/* Left brand panel — mesh gradient + product preview */}
      <div className="hidden lg:flex flex-col justify-between p-10 xl:p-12 border-r border-border/60 bg-hero-mesh relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
        />
        <div className="relative w-fit">
          <Logo href="/" />
        </div>

        <div className="relative grid xl:grid-cols-[1fr_400px] gap-10 xl:gap-12 items-center my-auto py-8">
          {/* Pitch */}
          <div className="space-y-4 max-w-md">
            <h2 className="font-display text-4xl xl:text-5xl text-foreground leading-[1.05]">
              Manje administracije,{" "}
              <em className="not-italic text-brand">više časova.</em>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Sve što ti treba za vođenje privatnih časova — učenici,
              raspored, naplata i AI generator zadataka. Na jednom mestu.
            </p>
            <ul className="pt-2 space-y-2">
              <FeatureBullet>Raspored & učenici na jednom mestu</FeatureBullet>
              <FeatureBullet>Naplata bez chaos-a, podsetnici</FeatureBullet>
              <FeatureBullet>AI generator zadataka iz matematike</FeatureBullet>
            </ul>
          </div>

          {/* Product preview illustration */}
          <div className="hidden xl:block">
            <AuthPreview />
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} Profesori
        </p>
      </div>

      {/* Right form */}
      <div className="flex flex-col bg-background relative">
        {/* Mobile hero band — mesh gradient backdrop visible only on mobile */}
        <div
          aria-hidden
          className="lg:hidden absolute inset-x-0 top-0 h-72 bg-hero-mesh pointer-events-none"
        />
        <div
          aria-hidden
          className="lg:hidden absolute inset-x-0 top-72 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
        />
        <div className="lg:hidden relative flex items-center justify-between px-5 h-14">
          <Logo />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium">
            <span className="size-1.5 rounded-full bg-brand pulse-dot" />
            <span className="text-muted-foreground">Privatni časovi</span>
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-12 relative">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-foreground/90">
      <span
        aria-hidden
        className="flex size-5 items-center justify-center rounded-md tile-cyan shrink-0"
      >
        <svg viewBox="0 0 24 24" className="size-3" fill="none">
          <path
            d="M5 12l5 5L20 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}
