import Link from "next/link";
import {
  Users,
  CalendarDays,
  Banknote,
  AlertCircle,
  ArrowRight,
  Plus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { requireUser } from "@/lib/supabase/auth";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { buttonVariants } from "@/components/ui/button";

export default async function DashboardPage() {
  const { profile } = await requireUser();
  const org = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;

  const firstName = profile.full_name?.split(" ")[0] ?? "profesore";
  const statusLabel =
    org?.subscription_status === "trialing"
      ? "probni period"
      : org?.subscription_status;

  return (
    <div className="px-4 sm:px-8 py-6 space-y-8 max-w-6xl mx-auto w-full">
      <PageHeader
        title={`Dobar dan, ${firstName}`}
        description={`${org?.name} · plan ${org?.subscription_tier} · ${statusLabel}`}
        actions={
          <Link href="/students/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="size-3.5" strokeWidth={2} />
            Dodaj učenika
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Aktivni učenici" value="0" icon={Users} />
        <StatCard label="Časova ove nedelje" value="0" icon={CalendarDays} />
        <StatCard
          label="Ukupan dug"
          value="0 RSD"
          icon={Banknote}
          hint="Niko ne duguje"
        />
        <StatCard
          label="Opomene"
          value="0"
          icon={AlertCircle}
          hint="U poslednjih 30 dana"
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Sledeći koraci</h2>
          <span className="text-xs text-muted-foreground">3 preostalo</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <NextStepCard
            href="/students/new"
            title="Dodaj prvog učenika"
            description="Ime, razred i cena po času. Ostalo automatski."
            icon={Users}
          />
          <NextStepCard
            href="/schedule"
            title="Zakaži prvi čas"
            description="Pojedinačan termin ili ponavljajući slot."
            icon={CalendarDays}
          />
          <NextStepCard
            href="/profile"
            title="Aktiviraj javni profil"
            description="Roditelji ti šalju upite preko forme."
            icon={Sparkles}
          />
        </div>
      </section>
    </div>
  );
}

function NextStepCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
    >
      <div className="flex items-center justify-between">
        <Icon
          className="size-4 text-muted-foreground"
          strokeWidth={1.75}
        />
        <ArrowRight className="size-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
      </div>
      <h3 className="text-sm font-medium mt-3">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
        {description}
      </p>
    </Link>
  );
}
