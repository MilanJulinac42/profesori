import { Sparkles } from "lucide-react";
import { ChatPanel } from "@/components/assistant/chat-panel";

export default function AsistentPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <header className="px-4 sm:px-8 py-4 border-b border-border">
        <h1 className="text-xl font-medium tracking-tight inline-flex items-center gap-2">
          <Sparkles className="size-5 text-amber-700" strokeWidth={1.75} />
          AI Asistent
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pitaj me bilo šta o tvom radu — daj informaciju, predloži akciju ili
          navigiraj kroz aplikaciju.
        </p>
      </header>
      <div className="flex-1 max-w-3xl mx-auto w-full">
        <ChatPanel fullPage />
      </div>
    </div>
  );
}
