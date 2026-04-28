"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { sr } from "date-fns/locale";
import {
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BOOKING_STATUS_LABELS,
  type BookingRequest,
  type BookingStatus,
} from "@/lib/booking/types";
import {
  setBookingStatus,
  convertBookingToStudent,
} from "@/lib/booking/actions";
import { cn } from "@/lib/utils";

export function BookingRow({ booking }: { booking: BookingRequest }) {
  const [expanded, setExpanded] = useState(booking.status === "new");
  const [pending, startTransition] = useTransition();

  const ago = formatDistanceToNowStrict(new Date(booking.created_at), {
    locale: sr,
    addSuffix: true,
  });

  function changeStatus(s: BookingStatus) {
    startTransition(async () => {
      try {
        await setBookingStatus(booking.id, s);
      } catch (e) {
        alert((e as Error).message);
      }
    });
  }

  function convert() {
    if (
      !confirm(
        "Konvertovati u učenika? Bićeš preusmeren na profil novog učenika gde možeš da popuniš ostale podatke.",
      )
    )
      return;
    startTransition(async () => {
      try {
        await convertBookingToStudent(booking.id);
      } catch (e) {
        alert((e as Error).message);
      }
    });
  }

  return (
    <li className="px-5 py-4">
      <button
        type="button"
        onClick={() => setExpanded((s) => !s)}
        className="flex items-start gap-3 w-full text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{booking.parent_name}</p>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {booking.subject && (
              <>
                {booking.subject}
                {booking.student_grade && ` · ${booking.student_grade}`}
                {" · "}
              </>
            )}
            {!booking.subject && booking.student_grade && (
              <>{booking.student_grade} · </>
            )}
            {ago}
          </p>
        </div>
        <span className="text-muted-foreground shrink-0">
          {expanded ? (
            <ChevronUp className="size-4" strokeWidth={1.75} />
          ) : (
            <ChevronDown className="size-4" strokeWidth={1.75} />
          )}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Contact info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
            {booking.parent_phone && (
              <a
                href={`tel:${booking.parent_phone}`}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Phone className="size-3" strokeWidth={1.75} />
                {booking.parent_phone}
              </a>
            )}
            {booking.parent_email && (
              <a
                href={`mailto:${booking.parent_email}`}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Mail className="size-3" strokeWidth={1.75} />
                {booking.parent_email}
              </a>
            )}
          </div>

          {/* Message */}
          {booking.message && (
            <div className="rounded-md bg-secondary/40 px-3 py-2.5 text-sm whitespace-pre-wrap leading-relaxed">
              {booking.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {booking.status !== "converted" && (
              <Button
                size="sm"
                onClick={convert}
                disabled={pending}
              >
                <UserPlus className="size-3.5" strokeWidth={2} />
                Konvertuj u učenika
              </Button>
            )}
            {booking.status !== "contacted" && booking.status !== "converted" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => changeStatus("contacted")}
                disabled={pending}
              >
                <Check className="size-3.5" strokeWidth={1.75} />
                Označi kao kontaktiran
              </Button>
            )}
            {booking.status !== "rejected" && booking.status !== "converted" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => changeStatus("rejected")}
                disabled={pending}
                className="text-muted-foreground"
              >
                <X className="size-3.5" strokeWidth={1.75} />
                Odbij
              </Button>
            )}
            {booking.status !== "new" && booking.status !== "converted" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => changeStatus("new")}
                disabled={pending}
                className="text-muted-foreground"
              >
                Vrati u nove
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const tone = {
    new: "bg-foreground text-background",
    contacted: "bg-secondary text-foreground",
    converted: "bg-secondary text-muted-foreground",
    rejected: "bg-secondary text-muted-foreground",
  }[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        tone,
      )}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}
