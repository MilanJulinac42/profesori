import { ArrowRight, Banknote, Sparkles, Star } from "lucide-react";
import type { PublicProfile, PricingPackage } from "@/lib/public-profile/types";
import { formatRsd, parasToRsd } from "@/lib/money";
import { pluralSr } from "../_shared/helpers";
import { cn } from "@/lib/utils";

export function PricingSection({ profile }: { profile: PublicProfile }) {
  const packages = profile.pricing_packages ?? [];
  if (packages.length === 0) return null;

  // Determine grid columns based on count.
  const cols =
    packages.length === 1
      ? "sm:grid-cols-1 max-w-md mx-auto"
      : packages.length === 2
        ? "sm:grid-cols-2 max-w-3xl mx-auto"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium tracking-tight inline-flex items-center gap-2">
          <Banknote className="size-5" strokeWidth={1.75} />
          Cenovnik
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paketi časova. Pošalji upit za rezervaciju.
        </p>
      </div>

      <div className={cn("grid gap-4", cols)}>
        {packages.map((pkg, i) => (
          <PricingCard key={i} pkg={pkg} />
        ))}
      </div>
    </section>
  );
}

function PricingCard({ pkg }: { pkg: PricingPackage }) {
  const perSession =
    pkg.sessions && pkg.sessions > 1
      ? Math.round(pkg.price / pkg.sessions)
      : null;

  return (
    <article
      className={cn(
        "relative rounded-2xl border bg-card p-6 flex flex-col",
        pkg.highlighted
          ? "border-foreground shadow-lg shadow-foreground/5"
          : "border-border",
      )}
    >
      {pkg.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1 text-[11px] font-medium uppercase tracking-wider whitespace-nowrap">
          <Star className="size-3 fill-current" strokeWidth={2} />
          Najpopularnije
        </span>
      )}

      <h3 className="text-lg font-medium tracking-tight">{pkg.name}</h3>

      {pkg.sessions && pkg.sessions > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          {pkg.sessions}{" "}
          {pluralSr(pkg.sessions, "čas", "časa", "časova")}
        </p>
      )}

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="text-3xl sm:text-4xl font-medium tracking-tight tabular-nums">
          {formatRsd(pkg.price, false)}
        </span>
        <span className="text-sm text-muted-foreground">RSD</span>
      </div>
      {perSession !== null && (
        <p className="text-xs text-muted-foreground tabular-nums mt-1">
          {parasToRsd(perSession)} RSD po času
        </p>
      )}

      {pkg.description && (
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          {pkg.description}
        </p>
      )}

      <a
        href="#booking"
        className={cn(
          "mt-auto pt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90",
          pkg.highlighted
            ? "bg-foreground text-background"
            : "bg-secondary text-foreground",
        )}
      >
        {pkg.highlighted && <Sparkles className="size-3.5" strokeWidth={2} />}
        Rezerviši
        <ArrowRight className="size-3.5" strokeWidth={2} />
      </a>
    </article>
  );
}
