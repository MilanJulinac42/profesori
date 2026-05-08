import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { countNewBookings } from "@/lib/booking/queries";
import { TourProvider } from "@/components/tour/tour-provider";
import { ThemeProvider } from "@/components/theme-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const [{ profile }, newBookings, { data: firstStudent }] = await Promise.all([
    requireUser(),
    countNewBookings(supabase),
    supabase
      .from("students")
      .select("id")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  const userName = profile.full_name ?? profile.email;
  const badges = { newBookings };
  const showOnboarding = !profile.onboarding_completed_at;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TourProvider
        onboardingCompleted={!showOnboarding}
        firstStudentId={(firstStudent?.id as string | undefined) ?? null}
      >
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
      </TourProvider>
    </ThemeProvider>
  );
}
