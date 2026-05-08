export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f4] flex items-center justify-center px-5 py-10">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sesija je istekla
        </h1>
        <p className="text-sm text-muted-foreground">
          Pristup roditeljskom portalu zahteva važeći link. Zatraži novi link
          od profesora — može da ti ga pošalje preko WhatsApp-a ili email-a.
        </p>
      </div>
    </div>
  );
}
