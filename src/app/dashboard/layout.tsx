import Link from "next/link";
import { requireUser } from "@/lib/supabase/auth";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUser();

  return (
    <>
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold">
            Profesori
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground hidden sm:inline">
              {profile.full_name ?? profile.email}
            </span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Odjavi se
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t py-4">
        <p className="max-w-6xl mx-auto px-6 text-xs text-muted-foreground">
          Platforma služi za evidenciju duga i uplata. Sve novčane transakcije
          odvijaju se direktno između profesora i učenika.
        </p>
      </footer>
    </>
  );
}
