import Link from "next/link";
import {
  ClipboardList,
  Clock,
  Award,
  Check,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CopyLinkButton } from "./copy-link-button";
import {
  HOMEWORK_STATUS_LABELS,
  type Homework,
  type HomeworkStatus,
} from "@/lib/homework/types";
import { cn } from "@/lib/utils";

type Props = {
  studentName: string;
  parentPhone: string | null;
  items: Homework[];
  appBaseUrl: string;
};

export function HomeworkPanel({
  studentName,
  parentPhone,
  items,
  appBaseUrl,
}: Props) {
  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-medium inline-flex items-center gap-2">
          <ClipboardList className="size-3.5" strokeWidth={1.75} />
          Domaći zadaci
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Još nije zadato nijedno domaći zadatak. Dodaj domaći iz dialog-a časa
          (Raspored → klikni čas → sekcija „Domaći za sledeći put").
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium inline-flex items-center gap-2">
            <ClipboardList className="size-3.5" strokeWidth={1.75} />
            Domaći zadaci
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {items.length} ukupno
          </p>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {items.map((hw) => (
          <Row
            key={hw.id}
            hw={hw}
            studentName={studentName}
            parentPhone={parentPhone}
            appBaseUrl={appBaseUrl}
          />
        ))}
      </ul>
    </section>
  );
}

function Row({
  hw,
  studentName,
  parentPhone,
  appBaseUrl,
}: {
  hw: Homework;
  studentName: string;
  parentPhone: string | null;
  appBaseUrl: string;
}) {
  const url = `${appBaseUrl}/h/${hw.public_token}`;
  const dueLabel = hw.due_date
    ? new Date(hw.due_date).toLocaleDateString("sr-Latn-RS", {
        day: "numeric",
        month: "short",
      })
    : null;
  const submittedLabel = hw.submitted_at
    ? new Date(hw.submitted_at).toLocaleDateString("sr-Latn-RS", {
        day: "numeric",
        month: "short",
      })
    : null;

  const shareText = [
    `Pozdrav! ${studentName} ima domaći:`,
    "",
    `📝 ${hw.title}`,
    hw.description ? `\n${hw.description}` : "",
    dueLabel ? `\n⏰ Rok: ${dueLabel}` : "",
    "",
    `Detalji i potvrda: ${url}`,
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\n+/g, "\n");

  const whatsappUrl = parentPhone
    ? `https://wa.me/${parentPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(shareText)}`
    : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <li className="px-5 py-4 space-y-2.5">
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{hw.title}</p>
        {hw.description && (
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
            {hw.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <StatusBadge status={hw.status} />
          {dueLabel && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" strokeWidth={1.75} />
              Rok: {dueLabel}
            </span>
          )}
          {submittedLabel && (
            <span className="inline-flex items-center gap-1">
              <Check className="size-3" strokeWidth={1.75} />
              Predato {submittedLabel}
            </span>
          )}
          {hw.teacher_grade !== null && (
            <span className="inline-flex items-center gap-1">
              <Award className="size-3" strokeWidth={1.75} />
              {hw.teacher_grade}/5
            </span>
          )}
        </div>
        {hw.submission_note && (
          <p className="text-xs text-muted-foreground italic mt-1 border-l-2 border-border pl-2">
            „{hw.submission_note}"
          </p>
        )}
        {hw.submission_images && hw.submission_images.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 mt-2">
            {hw.submission_images.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square rounded-md overflow-hidden border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`slika ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <CopyLinkButton url={url} />
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background hover:bg-secondary text-xs h-7 px-2.5"
        >
          <MessageCircle className="size-3" strokeWidth={1.75} />
          WhatsApp
        </a>
        <Link
          href={`/h/${hw.public_token}`}
          target="_blank"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background hover:bg-secondary text-xs h-7 px-2.5"
        >
          <ExternalLink className="size-3" strokeWidth={1.75} />
          Otvori
        </Link>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: HomeworkStatus }) {
  const tone =
    status === "submitted"
      ? "bg-amber-100 text-amber-900 border-amber-300"
      : status === "graded"
        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
        : status === "skipped"
          ? "bg-secondary text-muted-foreground border-border"
          : "bg-secondary text-foreground border-border";
  return (
    <Badge variant="outline" className={cn("font-normal text-[10px]", tone)}>
      {HOMEWORK_STATUS_LABELS[status]}
    </Badge>
  );
}
