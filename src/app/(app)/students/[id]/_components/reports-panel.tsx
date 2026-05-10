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
  RefreshCw,
  FileEdit,
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
      cached: boolean;
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

  function openPreview(kind: ReportKind, force = false) {
    setPreview({
      open: true,
      kind,
      loading: true,
      error: null,
      html: null,
      subject: null,
      shareText: null,
      cached: false,
    });
    setSendError(null);
    setSendOk(null);

    startTransition(async () => {
      const res = await previewReportAction(studentId, kind, "current", force);
      if (!res.ok) {
        setPreview({
          open: true,
          kind,
          loading: false,
          error: res.error,
          html: null,
          subject: null,
          shareText: null,
          cached: false,
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
        cached: res.cached,
      });
    });
  }

  function send(kind: ReportKind) {
    setSendError(null);
    setSendOk(null);
    setSendingKind(kind);

    startTransition(async () => {
      const res = await sendReportAction(studentId, kind, "current");
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
      <section
        data-tour="reports-panel"
        className="card-elevated card-glow rounded-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl tile-amber shrink-0">
              <Mail className="size-4" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground">Izveštaji</h2>
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
            <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium inline-flex items-center gap-1.5">
              <Check className="size-3" strokeWidth={2.25} />
              {sendOk}
            </p>
          )}
          {sendError && (
            <p className="text-xs text-rose-500 dark:text-rose-400 font-medium inline-flex items-start gap-1.5">
              <AlertCircle className="size-3 mt-0.5 shrink-0" strokeWidth={2} />
              {sendError}
            </p>
          )}
        </div>

        {logs.length > 0 && (
          <div className="border-t border-border">
            <div className="px-5 py-2.5 bg-secondary/30">
              <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
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
              <div className="px-5 pt-5 pb-4 border-b border-border flex items-start justify-between gap-3">
                <DialogHeader className="flex-1">
                  <DialogTitle className="flex items-center gap-2">
                    Preview: {REPORT_KIND_LABELS[preview.kind]}
                    {preview.cached && !preview.loading && (
                      <Badge variant="secondary" className="font-normal text-[10px]">
                        Keširan
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    {preview.cached
                      ? "Prikazana je sačuvana verzija. Klikni „Regeneriši“ za nov AI poziv."
                      : "Ovo se šalje email-om kad klikneš „Pošalji“."}
                  </DialogDescription>
                </DialogHeader>
                {!preview.loading && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openPreview(preview.kind, true)}
                    disabled={pending}
                  >
                    <RefreshCw
                      className={cn(
                        "size-3.5",
                        pending && "animate-spin",
                      )}
                      strokeWidth={1.75}
                    />
                    Regeneriši
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-auto bg-[#f6f6f4]">
                {preview.loading ? (
                  <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                    Učitavam izveštaj... (~5s ako se generiše svež)
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
        "rounded-xl border p-3.5 space-y-2.5 transition-colors",
        enabled
          ? "border-border bg-card hover:border-brand/30"
          : "border-border/40 bg-secondary/30 opacity-70",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-lg shrink-0",
            enabled ? "tile-amber" : "bg-secondary text-muted-foreground",
          )}
        >
          <CalendarRange className="size-3.5" strokeWidth={2} />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {REPORT_KIND_LABELS[kind]}
        </p>
      </div>
      {disabledReason && (
        <p className="text-[11px] text-muted-foreground italic">
          {disabledReason}
        </p>
      )}
      <div className="flex items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={onPreview}
          disabled={!enabled || pending}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-card border border-border text-foreground text-[0.8rem] font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye className="size-3.5" strokeWidth={1.75} />
          Pregled
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={!enabled || pending}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-brand text-brand-foreground text-[0.8rem] font-semibold hover:opacity-90 transition-opacity glow-brand disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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
        </button>
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
  const updatedDt = new Date(log.updated_at ?? log.sent_at);
  const shareText =
    typeof log.data_snapshot?.shareText === "string"
      ? (log.data_snapshot.shareText as string)
      : null;
  const periodLabel =
    typeof log.data_snapshot?.periodLabel === "string"
      ? (log.data_snapshot.periodLabel as string)
      : null;

  return (
    <li className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/20 transition-colors">
      <div className="text-xs tabular-nums text-muted-foreground w-24 shrink-0 font-medium">
        {updatedDt.toLocaleDateString("sr-Latn-RS", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        })}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate text-foreground">
          {REPORT_KIND_LABELS[log.kind]}
          {periodLabel && (
            <span className="ml-1.5 font-normal text-muted-foreground">
              · {periodLabel}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate inline-flex items-center gap-1.5">
          {log.recipient_email ? (
            <>
              <Mail className="size-3" strokeWidth={1.75} />
              {log.recipient_email}
            </>
          ) : (
            <span className="italic">nije poslat</span>
          )}
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
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tile-emerald">
        <Check className="size-2.5" strokeWidth={2.5} />
        Poslato
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tile-rose">
        <X className="size-2.5" strokeWidth={2.5} />
        Greška
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tile-amber">
        <FileEdit className="size-2.5" strokeWidth={2} />
        Nacrt
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-secondary text-muted-foreground">
      Preview
    </span>
  );
}
