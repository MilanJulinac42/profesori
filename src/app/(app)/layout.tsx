import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PageTransition } from "@/components/layout/page-transition";
import { countNewBookings } from "@/lib/booking/queries";
import { TourProvider } from "@/components/tour/tour-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AssistantWidget } from "@/components/assistant/widget";
import { AssistantProvider } from "@/components/assistant/assistant-context";

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

  const org = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;
  const trialEnd = org?.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const daysLeft = trialEnd
    ? Math.max(
        0,
        // eslint-disable-next-line react-hooks/purity
        Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : 14;
  const trial = org
    ? {
        daysLeft,
        tier: org.subscription_tier ?? "start",
        status: org.subscription_status ?? "trialing",
      }
    : undefined;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TourProvider
        onboardingCompleted={!showOnboarding}
        firstStudentId={(firstStudent?.id as string | undefined) ?? null}
      >
        <AssistantProvider>
          <div className="flex-1 flex">
            <Sidebar
              badges={badges}
              user={{ name: userName, email: profile.email }}
              trial={trial}
            />
            <div className="flex-1 flex flex-col min-w-0">
              <Topbar
                userName={userName}
                userEmail={profile.email}
                badges={badges}
                trial={trial}
              />
              <main className="flex-1 flex flex-col">
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </div>
          <AssistantWidget />
        </AssistantProvider>
      </TourProvider>
    </ThemeProvider>
  );
}
