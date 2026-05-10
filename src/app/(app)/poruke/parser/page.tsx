import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ParserForm } from "./_components/parser-form";

export default function ParserPage() {
  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-3xl mx-auto w-full">
      <Link
        href="/poruke"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 group"
      >
        <ArrowLeft
          className="size-3.5 group-hover:-translate-x-0.5 transition-transform"
          strokeWidth={1.75}
        />
        Nazad
      </Link>

      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl tile-violet shrink-0">
          <Sparkles className="size-5" strokeWidth={2} />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display text-3xl text-foreground leading-tight">
            AI parser poruka
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Paste poruku koju si dobio od roditelja (WhatsApp, Viber, SMS,
            email). AI će razumeti šta roditelj traži, izvući datume i imena, i
            predložiti akciju + odgovor koji možeš da kopiraš.
          </p>
        </div>
      </div>

      <ParserForm />
    </div>
  );
}
