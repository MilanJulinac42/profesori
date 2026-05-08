import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ParserForm } from "./_components/parser-form";

export default function ParserPage() {
  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-3xl mx-auto w-full">
      <Link
        href="/poruke"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Nazad
      </Link>

      <header className="space-y-2 pb-4 border-b border-border">
        <h1 className="text-2xl font-medium tracking-tight inline-flex items-center gap-2">
          <Sparkles className="size-5" strokeWidth={1.75} />
          AI parser poruka
        </h1>
        <p className="text-sm text-muted-foreground">
          Paste poruku koju si dobio od roditelja (WhatsApp, Viber, SMS, email).
          AI će razumeti šta roditelj traži, izvući datume i imena, i predložiti
          akciju + odgovor koji možeš da kopiraš.
        </p>
      </header>

      <ParserForm />
    </div>
  );
}
