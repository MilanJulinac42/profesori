"use client";

import { useState } from "react";
import {
  Link2,
  Copy,
  Check,
  MessageCircle,
  Mail,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { regenerateParentLinkAction } from "@/lib/parent-portal/actions";

type Props = {
  studentId: string;
  studentName: string;
  initialToken: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  appBaseUrl: string;
};

export function ParentLinkButton({
  studentId,
  studentName,
  initialToken,
  parentName,
  parentPhone,
  parentEmail,
  appBaseUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [regenPending, setRegenPending] = useState(false);

  const url = token ? `${appBaseUrl}/r/login/${token}` : "";
  const greeting = parentName ? parentName : "Pozdrav";

  const shareText = `${greeting}, šaljem vam privatni link za praćenje rada ${studentName}-a — možete videti časove, izveštaje i domaće zadatke u svakom trenutku.\n\n${url}\n\nLink je vezan samo za vaše dete; nije potrebno korisničko ime ni lozinka.`;

  function copyLink() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function regenerate() {
    setRegenPending(true);
    regenerateParentLinkAction(studentId).then((res) => {
      setRegenPending(false);
      if (res.ok) setToken(res.token);
    });
  }

  const whatsappUrl = parentPhone
    ? `https://wa.me/${parentPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(shareText)}`
    : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const mailtoUrl = parentEmail
    ? `mailto:${parentEmail}?subject=${encodeURIComponent(
        `Praćenje rada — ${studentName}`,
      )}&body=${encodeURIComponent(shareText)}`
    : null;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <Link2 className="size-3.5" strokeWidth={2} />
        Link za roditelja
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Roditeljski portal — link</DialogTitle>
            <DialogDescription>
              Pošalji ovaj privatan link roditelju. Bez login-a, vide istoriju
              časova, domaće, izveštaje i komentare.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="rounded-md border border-border bg-secondary/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Privatni link
              </p>
              <p className="text-xs font-mono break-all leading-relaxed">{url}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={copyLink}
              >
                {copied ? (
                  <Check className="size-3.5" strokeWidth={2} />
                ) : (
                  <Copy className="size-3.5" strokeWidth={1.75} />
                )}
                {copied ? "Kopirano" : "Kopiraj link"}
              </Button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background hover:bg-secondary text-sm h-8 px-3"
              >
                <MessageCircle className="size-3.5" strokeWidth={1.75} />
                WhatsApp
              </a>
              {mailtoUrl && (
                <a
                  href={mailtoUrl}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background hover:bg-secondary text-sm h-8 px-3"
                >
                  <Mail className="size-3.5" strokeWidth={1.75} />
                  Email
                </a>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={regenerate}
                disabled={regenPending}
                className="ml-auto"
              >
                <RefreshCw
                  className={`size-3.5 ${regenPending ? "animate-spin" : ""}`}
                  strokeWidth={1.75}
                />
                Generiši nov
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1.5 pt-2 border-t border-border">
              <p>
                <strong className="text-foreground">Bezbednost:</strong> Link
                sadrži 32-cifreni nasumični token koji se ne može pogoditi.
                Portal NE prikazuje broj telefona ni email niti drugih
                kontakata profesora.
              </p>
              <p>
                <strong className="text-foreground">Generiši nov:</strong> Stari
                link prestaje da radi — koristi ako sumnjaš da je link
                procurio.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
