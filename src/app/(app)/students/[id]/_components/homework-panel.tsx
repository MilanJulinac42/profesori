import Link from "next/link";
import {
  ClipboardList,
  Clock,
  Award,
  Check,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
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
      <section className="card-elevated card-glow rounded-2xl py-8">
        <EmptyState
          icon={ClipboardList}
          tile="violet"
          title="Još nema domaćih zadataka"
          description="Dodaj domaći iz dialog-a časa (Raspored → klikni čas → sekcija „Domaći za sledeći put“)."
        />
      </section>
    );
  }

  return (
    <section className="card-elevated card-glow rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl tile-violet shrink-0">
            <ClipboardList className="size-4" strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-display text-xl text-foreground">
              Domaći zadaci
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {items.length} ukupno
            </p>
          </div>
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
    <li className="px-5 py-4 space-y-3 hover:bg-secondary/20 transition-colors">
      <div className="space-y-1.5">
        <p className="text-[0.95rem] font-semibold text-foreground">
          {hw.title}
        </p>
        {hw.description && (
          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
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
            <span className="inline-flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-medium">
              <Check className="size-3" strokeWidth={2} />
              Predato {submittedLabel}
            </span>
          )}
          {hw.teacher_grade !== null && (
            <span className="inline-flex items-center gap-1 text-amber-500 dark:text-amber-400 font-semibold">
              <Award className="size-3" strokeWidth={2} />
              {hw.teacher_grade}/5
            </span>
          )}
        </div>
        {hw.submission_note && (
          <p className="text-xs text-muted-foreground italic mt-1 border-l-2 border-brand pl-2.5 leading-relaxed">
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
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 hover:bg-secondary text-xs font-medium h-7 px-2.5 transition-colors"
        >
          <MessageCircle className="size-3" strokeWidth={2} />
          WhatsApp
        </a>
        <Link
          href={`/h/${hw.public_token}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 hover:bg-secondary text-xs font-medium h-7 px-2.5 transition-colors"
        >
          <ExternalLink className="size-3" strokeWidth={2} />
          Otvori
        </Link>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: HomeworkStatus }) {
  const tile =
    status === "submitted"
      ? "amber"
      : status === "graded"
        ? "emerald"
        : status === "skipped"
          ? "rose"
          : "cyan";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
        `tile-${tile}`,
      )}
    >
      {HOMEWORK_STATUS_LABELS[status]}
    </span>
  );
}
