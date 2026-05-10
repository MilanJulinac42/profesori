import { Sparkles } from "lucide-react";
import { ChatPanel } from "@/components/assistant/chat-panel";

export default function AsistentPage() {
  return (
    <div className="flex flex-col">
      <header className="sticky top-14 z-20 px-4 sm:px-8 py-4 border-b border-border flex items-center gap-3 bg-background/90 backdrop-blur-md">
        <div className="flex size-10 items-center justify-center rounded-xl tile-violet shrink-0">
          <Sparkles className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            AI Asistent
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pitaj me bilo šta o tvom radu — daj informaciju, predloži akciju ili
            navigiraj kroz aplikaciju.
          </p>
        </div>
      </header>
      <div className="max-w-3xl mx-auto w-full">
        <ChatPanel fullPage />
      </div>
    </div>
  );
}
