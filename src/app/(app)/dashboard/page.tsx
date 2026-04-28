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
    <div className="px-4 sm:px-8 py-8 space-y-8 max-w-6xl mx-auto w-full">
      <PageHeader
        title={`Dobar dan, ${firstName}.`}
        description={`${org?.name} · plan ${org?.subscription_tier} · ${statusLabel}`}
        actions={
          <Link href="/students/new" className={buttonVariants({ size: "lg" })}>
            <Plus className="size-4" />
            Dodaj učenika
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Aktivni učenici" value="0" icon={Users} tone="primary" />
        <StatCard label="Časova ove nedelje" value="0" icon={CalendarDays} />
        <StatCard
          label="Ukupan dug"
          value="0 RSD"
          icon={Banknote}
          tone="warning"
          hint="Niko ne duguje."
        />
        <StatCard
          label="Opomene"
          value="0"
          icon={AlertCircle}
          hint="U poslednjih 30 dana"
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Sledeći koraci</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <NextStepCard
            href="/students/new"
            title="Dodaj prvog učenika"
            description="Unesi ime, razred i cenu po času. Ostalo automatski."
            icon={Users}
          />
          <NextStepCard
            href="/schedule"
            title="Zakaži prvi čas"
            description="Postavi termin ili ponavljajući slot u nedelji."
            icon={CalendarDays}
          />
          <NextStepCard
            href="/profile"
            title="Aktiviraj javni profil"
            description="Roditelji mogu da ti šalju upit preko booking forme."
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
      className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-[0_2px_12px_rgba(15,118,110,0.08)]"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
        <Icon className="size-5" />
      </div>
      <h3 className="font-medium text-base">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      <span className="text-sm text-primary inline-flex items-center gap-1 mt-3 group-hover:gap-2 transition-all">
        Kreni <ArrowRight className="size-3.5" />
      </span>
    </Link>
  );
}
