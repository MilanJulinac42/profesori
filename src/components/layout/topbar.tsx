import Link from "next/link";
import { Bell } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { ProfileMenu } from "./profile-menu";
import { HelpButton } from "@/components/tour/help-button";

export function Topbar({
  userName,
  userEmail,
  badges,
  trial,
}: {
  userName: string;
  userEmail: string;
  badges?: { newBookings?: number };
  trial?: { daysLeft: number; tier: string; status: string };
}) {
  const newBookings = badges?.newBookings ?? 0;

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-md print:hidden">
      <div className="h-full px-4 sm:px-6 flex items-center gap-3">
        <MobileNav
          badges={badges}
          user={{ name: userName, email: userEmail }}
          trial={trial}
        />
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <Link
            href="/profile/inbox"
            aria-label={`Upiti${newBookings > 0 ? ` (${newBookings} novih)` : ""}`}
            className="relative inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Bell className="size-4" strokeWidth={1.75} />
            {newBookings > 0 && (
              <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-brand text-brand-foreground text-[9px] font-bold px-1 shadow-[0_2px_8px_-2px_oklch(0.78_0.16_205/0.5)] tabular-nums">
                {newBookings > 9 ? "9+" : newBookings}
              </span>
            )}
            {newBookings > 0 && (
              <span
                aria-hidden
                className="absolute top-0.5 right-0.5 size-2 rounded-full bg-brand pulse-dot"
              />
            )}
          </Link>
          <HelpButton />
          <div className="ml-1 pl-2 border-l border-border/60">
            <ProfileMenu name={userName} email={userEmail} />
          </div>
        </div>
      </div>
    </header>
  );
}
