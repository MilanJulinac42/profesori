"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Copy,
  MessageSquare,
  Mail,
  Smartphone,
  Check,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  generateReminderText,
  type ReminderContext,
} from "@/lib/reminders/template";
import { logReminder } from "@/lib/reminders/actions";
import type { ReminderChannel } from "@/lib/reminders/types";
import { formatRsd } from "@/lib/money";
import { cn } from "@/lib/utils";

export type ReminderDialogProps = {
  open: boolean;
  onClose: () => void;
  studentId: string;
  context: ReminderContext;
  parentPhone?: string | null;
  parentEmail?: string | null;
  customTemplate?: string | null;
};

export function ReminderDialog({
  open,
  onClose,
  studentId,
  context,
  parentPhone,
  parentEmail,
  customTemplate,
}: ReminderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <Form
          studentId={studentId}
          context={context}
          parentPhone={parentPhone ?? null}
          parentEmail={parentEmail ?? null}
          customTemplate={customTemplate ?? null}
          onDone={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function Form({
  studentId,
  context,
  parentPhone,
  parentEmail,
  customTemplate,
  onDone,
}: {
  studentId: string;
  context: ReminderContext;
  parentPhone: string | null;
  parentEmail: string | null;
  customTemplate: string | null;
  onDone: () => void;
}) {
  const initialText = generateReminderText(context, customTemplate);
  const [text, setText] = useState(initialText);
  const [pending, startTransition] = useTransition();
  const [sentVia, setSentVia] = useState<ReminderChannel | null>(null);

  // Reset text when student changes (different context).
  useEffect(() => {
    setText(initialText);
    setSentVia(null);
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  function send(channel: ReminderChannel) {
    startTransition(async () => {
      // Channel side-effect first (sync; needs user gesture).
      try {
        if (channel === "copy" || channel === "viber") {
          await navigator.clipboard.writeText(text);
        }
        if (channel === "sms" && parentPhone) {
          window.location.href = `sms:${parentPhone}?body=${encodeURIComponent(text)}`;
        } else if (channel === "email" && parentEmail) {
          const subject = `Podsetnik za uplatu — ${context.studentName}`;
          window.location.href = `mailto:${parentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
        } else if (channel === "viber") {
          // Best-effort: open Viber. Will fail silently if not installed.
          // Tekst je već u clipboard-u — profesor zalepi u Viber chat.
          setTimeout(() => {
            window.location.href = "viber://";
          }, 100);
        }
      } catch {
        // Clipboard API may fail in some contexts. Continue anyway.
      }

      // Log it.
      try {
        await logReminder({
          studentId,
          channel,
          message: text,
          amountAtSend: context.debt,
        });
        setSentVia(channel);

        const messages: Record<ReminderChannel, string> = {
          copy: "Tekst kopiran. Zalepi ga u Viber/WhatsApp.",
          sms: "SMS otvoren. Pošalji iz aplikacije za poruke.",
          email: "Email klijent otvoren. Pošalji iz mail aplikacije.",
          viber: "Tekst kopiran. Otvori Viber i zalepi u chat.",
        };
        toast.success("Opomena evidentirana", {
          description: messages[channel],
        });

        // Auto-close after a moment (give user time to see confirmation).
        setTimeout(onDone, 1200);
      } catch (e) {
        toast.error("Greška pri evidentiranju opomene", {
          description: (e as Error).message,
        });
      }
    });
  }

  return (
    <div>
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <DialogHeader>
          <DialogTitle>Pošalji opomenu</DialogTitle>
          <DialogDescription>
            {context.studentName} duguje{" "}
            <span className="font-medium text-foreground">
              {formatRsd(context.debt)}
            </span>{" "}
            za {context.unpaidLessonsCount}{" "}
            {context.unpaidLessonsCount === 1
              ? "neplaćen čas"
              : context.unpaidLessonsCount < 5
                ? "neplaćena časa"
                : "neplaćenih časova"}
            .
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="px-5 py-4 space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={9}
          className="text-sm leading-relaxed font-mono"
        />
        <p className="text-[11px] text-muted-foreground">
          Slobodno izmeni tekst pre slanja.
        </p>
      </div>

      <Separator />

      <div className="px-5 py-4 space-y-2">
        <p className="text-xs text-muted-foreground">Izaberi kanal:</p>
        <div className="grid grid-cols-2 gap-2">
          <ChannelButton
            icon={Copy}
            label="Kopiraj"
            sublabel="za Viber, WhatsApp..."
            onClick={() => send("copy")}
            sent={sentVia === "copy"}
            disabled={pending}
          />
          <ChannelButton
            icon={Smartphone}
            label="SMS"
            sublabel={parentPhone ?? "Nema broj"}
            onClick={() => send("sms")}
            sent={sentVia === "sms"}
            disabled={pending || !parentPhone}
          />
          <ChannelButton
            icon={Mail}
            label="Email"
            sublabel={parentEmail ?? "Nema email"}
            onClick={() => send("email")}
            sent={sentVia === "email"}
            disabled={pending || !parentEmail}
          />
          <ChannelButton
            icon={MessageSquare}
            label="Viber"
            sublabel="Otvara Viber app"
            onClick={() => send("viber")}
            sent={sentVia === "viber"}
            disabled={pending}
          />
        </div>
      </div>

      <DialogFooter className="!mx-0 !mb-0">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Zatvori
        </Button>
      </DialogFooter>
    </div>
  );
}

function ChannelButton({
  icon: Icon,
  label,
  sublabel,
  onClick,
  sent,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  sublabel: string;
  onClick: () => void;
  sent: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        sent
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card hover:bg-secondary",
        disabled && !sent && "opacity-50 cursor-not-allowed hover:bg-card",
      )}
    >
      {sent ? (
        <Check className="size-4 shrink-0" strokeWidth={2.5} />
      ) : (
        <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p
          className={cn(
            "text-[11px] truncate",
            sent ? "text-background/70" : "text-muted-foreground",
          )}
        >
          {sublabel}
        </p>
      </div>
    </button>
  );
}
