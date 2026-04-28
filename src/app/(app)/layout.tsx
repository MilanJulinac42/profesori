import { requireUser } from "@/lib/supabase/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUser();
  const userName = profile.full_name ?? profile.email;

  return (
    <div className="flex-1 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar userName={userName} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-4">
          <p className="px-4 sm:px-8 text-xs text-muted-foreground">
            Platforma služi za evidenciju duga i uplata. Sve novčane
            transakcije odvijaju se direktno između profesora i učenika.
          </p>
        </footer>
      </div>
    </div>
  );
}
