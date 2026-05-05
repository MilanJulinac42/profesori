import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { countNewBookings } from "@/lib/booking/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUser();
  const userName = profile.full_name ?? profile.email;

  const supabase = await createClient();
  const newBookings = await countNewBookings(supabase);
  const badges = { newBookings };

  return (
    <div className="flex-1 flex">
      <Sidebar badges={badges} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar userName={userName} badges={badges} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-4 print:hidden">
          <p className="px-4 sm:px-8 text-xs text-muted-foreground">
            Platforma služi za evidenciju duga i uplata. Sve novčane
            transakcije odvijaju se direktno između profesora i učenika.
          </p>
        </footer>
      </div>
    </div>
  );
}
