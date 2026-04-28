import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getBookingRequests } from "@/lib/booking/queries";
import {
  BOOKING_STATUS_LABELS,
  type BookingStatus,
} from "@/lib/booking/types";
import { cn } from "@/lib/utils";
import { BookingRow } from "./_components/booking-row";

type Search = { status?: string };

const FILTERS: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "Svi" },
  { value: "new", label: "Novi" },
  { value: "contacted", label: "Kontaktirani" },
  { value: "converted", label: "Konvertovani" },
  { value: "rejected", label: "Odbijeni" },
];

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const status = (params.status as BookingStatus) ?? null;

  const supabase = await createClient();
  const bookings = await getBookingRequests(supabase, {
    status: status ?? "all",
  });

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
      <Link
        href="/profile"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Nazad na profil
      </Link>

      <PageHeader
        title="Upiti"
        description="Roditelji koji su poslali upit preko tvog javnog profila."
      />

      {/* Filters */}
      <div className="flex items-center gap-1 text-xs flex-wrap">
        {FILTERS.map((f) => {
          const href = (() => {
            if (f.value === "all") return "/profile/inbox";
            return `/profile/inbox?status=${f.value}`;
          })();
          const active =
            (f.value === "all" && !status) || f.value === status;
          return (
            <Link
              key={f.value}
              href={href}
              className={cn(
                "rounded-md px-2.5 py-1.5 transition-colors",
                active
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={
            status
              ? `Nema upita u kategoriji "${BOOKING_STATUS_LABELS[status as BookingStatus]}"`
              : "Još nema upita"
          }
          description={
            status
              ? "Probaj drugu kategoriju."
              : "Aktiviraj profil i podeli link sa roditeljima da bi počeli da stižu upiti."
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <ul className="divide-y divide-border">
            {bookings.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
