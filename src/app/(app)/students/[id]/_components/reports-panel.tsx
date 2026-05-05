"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  CalendarRange,
  Mail,
  Send,
  AlertCircle,
  Eye,
  Loader2,
  Check,
  X,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  previewReportAction,
  sendReportAction,
} from "@/lib/reports/actions";
import { REPORT_KIND_LABELS, type ReportKind, type ReportLog } from "@/lib/reports/types";
import { cn } from "@/lib/utils";

type Props = {
  studentId: string;
  studentName: string;
  hasParentEmail: boolean;
  hasStudentEmail: boolean;
  parentPhone: string | null;
  audience: "parent" | "student";
  weeklyEnabled: boolean;
  monthlyEnabled: boolean;
  logs: ReportLog[];
};

type PreviewState =
  | { open: false }
  | {
      open: true;
      kind: ReportKind;
      loading: boolean;
      error: string | null;
      html: string | null;
      subject: string | null;
      shareText: string | null;
    };

function buildWhatsAppUrl(text: string, phone?: string | null): string {
  const encoded = encodeURIComponent(text);
  const phoneTrimmed = phone?.replace(/[^\d]/g, "") ?? "";
  return phoneTrimmed
    ? `https://wa.me/${phoneTrimmed}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

export function ReportsPanel({
  studentId,
  studentName,
  hasParentEmail,
  hasStudentEmail,
  parentPhone,
  audience,
  weeklyEnabled,
  monthlyEnabled,
  logs,
}: Props) {
  const [preview, setPreview] = useState<PreviewState>({ open: false });
  const [sendingKind, setSendingKind] = useState<ReportKind | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendOk, setSendOk] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const recipientLabel =
    audience === "parent"
      ? hasParentEmail
        ? "roditelju"
        : "(roditelj nema email)"
      : hasStudentEmail
        ? "učeniku"
        : "(učenik nema email)";

  const recipientReady =
    audience === "parent" ? hasParentEmail : hasStudentEmail;

  function openPreview(kind: ReportKind) {
    setPreview({
      open: true,
      kind,
      loading: true,
      error: null,
      html: null,
      subject: null,
      shareText: null,
    });
    setSendError(null);
    setSendOk(null);

    startTransition(async () => {
      const res = await previewReportAction(studentId, kind, "past");
      if (!res.ok) {
        setPreview({
          open: true,
          kind,
          loading: false,
          error: res.error,
          html: null,
          subject: null,
          shareText: null,
        });
        return;
      }
      setPreview({
        open: true,
        kind,
        loading: false,
        error: null,
        html: res.html,
        subject: res.subject,
        shareText: res.shareText,
      });
    });
  }

  function send(kind: ReportKind) {
    setSendError(null);
    setSendOk(null);
    setSendingKind(kind);

    startTransition(async () => {
      const res = await sendReportAction(studentId, kind, "past");
      setSendingKind(null);
      if (!res.ok) {
        setSendError(res.error);
        return;
      }
      setSendOk(`Poslato na ${res.recipient}`);
      setPreview({ open: false });
    });
  }

  return (
    <>
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">Izveštaji</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Šalje se {recipientLabel}. Ova publika i email se menjaju u{" "}
              <Link
                href={`/students/${studentId}/edit`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                izmeni profil
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-2">
            <ReportCta
              kind="weekly"
              enabled={weeklyEnabled && recipientReady}
              disabledReason={
                !weeklyEnabled
                  ? "Isključeno na profilu"
                  : !recipientReady
                    ? "Nedostaje email"
                    : null
              }
              onPreview={() => openPreview("weekly")}
              onSend={() => send("weekly")}
              sending={sendingKind === "weekly"}
              pending={pending}
            />
            <ReportCta
              kind="monthly"
              enabled={monthlyEnabled && recipientReady}
              disabledReason={
                !monthlyEnabled
                  ? "Isključeno na profilu"
                  : !recipientReady
                    ? "Nedostaje email"
                    : null
              }
              onPreview={() => openPreview("monthly")}
              onSend={() => send("monthly")}
              sending={sendingKind === "monthly"}
              pending={pending}
            />
          </div>

          {sendOk && (
            <p className="text-xs text-foreground inline-flex items-center gap-1.5">
              <Check className="size-3" strokeWidth={2} />
              {sendOk}
            </p>
          )}
          {sendError && (
            <p className="text-xs text-destructive inline-flex items-start gap-1.5">
              <AlertCircle className="size-3 mt-0.5 shrink-0" strokeWidth={1.75} />
              {sendError}
            </p>
          )}
        </div>

        {logs.length > 0 && (
          <div className="border-t border-border">
            <div className="px-5 py-2 bg-secondary/30">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Istorija ({logs.length})
              </p>
            </div>
            <ul className="divide-y divide-border">
              {logs.map((l) => (
                <LogRow
                  key={l.id}
                  log={l}
                  studentName={studentName}
                  parentPhone={parentPhone}
                />
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Preview dialog */}
      <Dialog
        open={preview.open}
        onOpenChange={(o) => {
          if (!o) setPreview({ open: false });
        }}
      >
        <DialogContent className="sm:max-w-2xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
          {preview.open && (
            <>
              <div className="px-5 pt-5 pb-4 border-b border-border">
                <DialogHeader>
                  <DialogTitle>
                    Preview: {REPORT_KIND_LABELS[preview.kind]}
                  </DialogTitle>
                  <DialogDescription>
                    Ovo se šalje email-om kad klikneš “Pošalji”.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-auto bg-[#f6f6f4]">
                {preview.loading ? (
                  <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                    Generišem izveštaj... (~5s)
                  </div>
                ) : preview.error ? (
                  <div className="p-6 text-sm text-destructive">
                    {preview.error}
                  </div>
                ) : preview.html ? (
                  <iframe
                    title="Report preview"
                    srcDoc={preview.html}
                    sandbox=""
                    className="w-full h-[70vh] border-0 bg-white"
                  />
                ) : null}
              </div>

              <DialogFooter className="!mx-0 !mb-0 px-5 py-4 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreview({ open: false })}
                >
                  Zatvori
                </Button>
                {preview.shareText && (
                  <a
                    href={buildWhatsAppUrl(
                      preview.shareText,
                      audience === "parent" ? parentPhone : null,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background hover:bg-secondary text-sm h-8 px-3"
                  >
                    <MessageCircle className="size-3.5" strokeWidth={1.75} />
                    WhatsApp
                  </a>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => send(preview.kind)}
                  disabled={
                    pending ||
                    preview.loading ||
                    !preview.html ||
                    !recipientReady
                  }
                >
                  {sendingKind === preview.kind ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                      Slanje...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" strokeWidth={2} />
                      Pošalji email
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportCta({
  kind,
  enabled,
  disabledReason,
  onPreview,
  onSend,
  sending,
  pending,
}: {
  kind: ReportKind;
  enabled: boolean;
  disabledReason: string | null;
  onPreview: () => void;
  onSend: () => void;
  sending: boolean;
  pending: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 space-y-2",
        enabled
          ? "border-border bg-background"
          : "border-border/50 bg-secondary/30",
      )}
    >
      <div className="flex items-center gap-1.5">
        <CalendarRange className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
        <p className="text-sm font-medium">{REPORT_KIND_LABELS[kind]}</p>
      </div>
      {disabledReason && (
        <p className="text-[11px] text-muted-foreground">{disabledReason}</p>
      )}
      <div className="flex items-center gap-1.5 pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onPreview}
          disabled={!enabled || pending}
        >
          <Eye className="size-3.5" strokeWidth={1.75} />
          Pregled
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSend}
          disabled={!enabled || pending}
        >
          {sending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
              Slanje...
            </>
          ) : (
            <>
              <Send className="size-3.5" strokeWidth={2} />
              Pošalji
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function LogRow({
  log,
  studentName,
  parentPhone,
}: {
  log: ReportLog;
  studentName: string;
  parentPhone: string | null;
}) {
  const sentDt = new Date(log.sent_at);
  const shareText =
    typeof log.data_snapshot?.shareText === "string"
      ? (log.data_snapshot.shareText as string)
      : null;

  return (
    <li className="px-5 py-3 flex items-center gap-3">
      <div className="text-xs tabular-nums text-muted-foreground w-24 shrink-0">
        {sentDt.toLocaleDateString("sr-Latn-RS", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        })}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {REPORT_KIND_LABELS[log.kind]}
        </div>
        <div className="text-xs text-muted-foreground truncate inline-flex items-center gap-1.5">
          <Mail className="size-3" strokeWidth={1.75} />
          {log.recipient_email}
        </div>
      </div>
      <StatusBadge status={log.status} />
      {shareText && (
        <a
          href={buildWhatsAppUrl(
            shareText,
            log.audience === "parent" ? parentPhone : null,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground"
          aria-label={`Podeli izveštaj za ${studentName} preko WhatsApp-a`}
        >
          <MessageCircle className="size-3.5" strokeWidth={1.75} />
        </a>
      )}
      <Link
        href={`/reports/${log.id}`}
        className="text-xs text-muted-foreground hover:text-foreground"
        aria-label={`Otvori izveštaj za ${studentName}`}
      >
        <Eye className="size-3.5" strokeWidth={1.75} />
      </Link>
    </li>
  );
}

function StatusBadge({ status }: { status: ReportLog["status"] }) {
  if (status === "sent") {
    return (
      <Badge variant="outline" className="font-normal text-[10px] gap-1">
        <Check className="size-2.5" strokeWidth={2.5} />
        Poslato
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge
        variant="outline"
        className="font-normal text-[10px] gap-1 border-destructive/40 text-destructive"
      >
        <X className="size-2.5" strokeWidth={2.5} />
        Greška
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-normal text-[10px]">
      Preview
    </Badge>
  );
}
