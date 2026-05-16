import { MobileNav } from "./mobile-nav";
import { ProfileMenu } from "./profile-menu";
import { HelpButton } from "@/components/tour/help-button";
import { NotificationsBell } from "./notifications-bell";
import type { NotificationItem } from "@/lib/notifications";

export function Topbar({
  userName,
  userEmail,
  badges,
  trial,
  notificationItems,
  notificationUnread,
}: {
  userName: string;
  userEmail: string;
  badges?: { newBookings?: number };
  trial?: { daysLeft: number; tier: string; status: string };
  notificationItems: NotificationItem[];
  notificationUnread: number;
}) {
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
          <NotificationsBell
            initialItems={notificationItems}
            initialUnreadCount={notificationUnread}
          />
          <HelpButton />
          <div className="ml-1 pl-2 border-l border-border/60">
            <ProfileMenu name={userName} email={userEmail} />
          </div>
        </div>
      </div>
    </header>
  );
}
