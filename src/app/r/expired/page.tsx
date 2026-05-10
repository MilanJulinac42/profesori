import { Clock } from "lucide-react";

export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-10">
      <div className="card-elevated card-glow rounded-2xl max-w-md w-full text-center space-y-4 p-8">
        <div className="flex size-12 items-center justify-center rounded-2xl tile-amber mx-auto">
          <Clock className="size-5" strokeWidth={2} />
        </div>
        <h1 className="font-display text-2xl text-foreground tracking-tight">
          Sesija je istekla
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pristup roditeljskom portalu zahteva važeći link. Zatraži novi link od
          profesora — može da ti ga pošalje preko WhatsApp-a ili email-a.
        </p>
      </div>
    </div>
  );
}
