import { Logo, LogoMark } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 grid lg:grid-cols-[1fr_minmax(420px,520px)]">
      {/* Left brand panel — light, minimal */}
      <div className="hidden lg:flex flex-col justify-between p-10 border-r border-border bg-secondary/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
        <div className="relative w-fit">
          <Logo />
        </div>

        <div className="relative space-y-3 max-w-md">
          <h2 className="text-3xl font-medium tracking-tight leading-[1.15]">
            Manje administracije,
            <br />
            <span className="text-muted-foreground">više vremena za časove.</span>
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sve što ti treba za vođenje privatnih časova — učenici, raspored,
            naplata i AI generator zadataka. Na jednom mestu.
          </p>
        </div>

        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} Profesori
        </p>
      </div>

      {/* Right form */}
      <div className="flex flex-col">
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
