import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function Topbar({
  userName,
  badges,
}: {
  userName: string;
  badges?: { newBookings?: number };
}) {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-md print:hidden">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        <MobileNav badges={badges} />
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground hidden sm:inline mr-2">
            {userName}
          </span>
          <ThemeToggle />
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Odjavi se
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
