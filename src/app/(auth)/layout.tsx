import Link from "next/link";
import { GraduationCap, Sparkles, Users, Banknote } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-primary text-primary-foreground relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <Link href="/" className="relative flex items-center gap-2 w-fit">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
            <GraduationCap className="size-5" />
          </div>
          <span className="font-heading text-2xl">Profesori</span>
        </Link>

        <div className="relative space-y-6 max-w-md">
          <h2 className="font-heading text-4xl leading-tight">
            Manje administracije, više vremena za časove.
          </h2>
          <p className="text-primary-foreground/75 text-lg">
            Sve što ti treba za vođenje privatnih časova — na jednom mestu.
          </p>
          <ul className="space-y-3 text-primary-foreground/85">
            <Feature icon={Users} text="Učenici, beleške i kontakti" />
            <Feature icon={Banknote} text="Evidencija duga i uplata" />
            <Feature icon={Sparkles} text="AI generator zadataka" />
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/55">
          © {new Date().getFullYear()} Profesori. Sva prava zadržana.
        </p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="lg:hidden flex items-center gap-2 mb-10 justify-center"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </div>
            <span className="font-heading text-xl">Profesori</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  text,
}: {
  icon: typeof Users;
  text: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/10">
        <Icon className="size-4" />
      </span>
      <span>{text}</span>
    </li>
  );
}
