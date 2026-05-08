"use client";

import { useMemo, useState } from "react";
import {
  MessageCircle,
  Mail,
  Phone,
  Check,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Student = {
  id: string;
  full_name: string;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
};

type Channel = "whatsapp" | "email";

const TEMPLATES: { id: string; label: string; body: string }[] = [
  {
    id: "pause",
    label: "Pauza časova",
    body: `Pozdrav {ime_roditelja}, časovi pauziraju u periodu od ___ do ___. Javiću novi raspored čim bude poznato. Hvala na razumevanju!`,
  },
  {
    id: "reschedule",
    label: "Pomeranje termina",
    body: `Pozdrav {ime_roditelja}, predlažem da {ime}-ov sledeći čas premestim na ___ u ___. Da li odgovara?`,
  },
  {
    id: "reminder",
    label: "Podsetnik",
    body: `Pozdrav {ime_roditelja}, samo podsetnik da je {ime}-ov sledeći čas zakazan za ___ u ___. Vidimo se!`,
  },
  {
    id: "happy_holidays",
    label: "Praznici",
    body: `Pozdrav {ime_roditelja}, želim Vama i {ime}-u srećne praznike! Vidimo se ___.`,
  },
];

function applyTemplate(
  template: string,
  student: Student,
): string {
  return template
    .replace(/\{ime_roditelja\}/g, student.parent_name?.trim() || "")
    .replace(/\{ime\}/g, student.full_name.split(" ")[0] ?? student.full_name);
}

function whatsappUrl(text: string, phone: string | null): string {
  const encoded = encodeURIComponent(text);
  const phoneTrimmed = phone?.replace(/[^\d]/g, "") ?? "";
  return phoneTrimmed
    ? `https://wa.me/${phoneTrimmed}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

function mailtoUrl(subject: string, body: string, email: string): string {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${email}?${params.toString()}`;
}

export function BulkForm({ students }: { students: Student[] }) {
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(students.map((s) => s.id)),
  );
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState(""); // za email
  const [opening, setOpening] = useState(false);

  const selected = useMemo(
    () => students.filter((s) => selectedIds.has(s.id)),
    [students, selectedIds],
  );

  // Po channel-u, zelimo samo recipijente sa odgovarajucim kontaktom
  const validRecipients = useMemo(() => {
    if (channel === "whatsapp") {
      // wa.me bez broja takođe radi (otvara picker), pa ne filtriramo strogo
      return selected;
    }
    return selected.filter((s) => !!s.parent_email);
  }, [selected, channel]);

  const previewStudent = validRecipients[0] ?? selected[0];
  const previewText = previewStudent
    ? applyTemplate(message, previewStudent)
    : message;

  function toggleAll() {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyTemplateChoice(body: string) {
    setMessage(body);
  }

  async function sendAll() {
    if (!message.trim() || validRecipients.length === 0) return;
    setOpening(true);

    // Otvori sve u redosledu sa malim delay-om da browser ne blokuje pop-up-e
    for (let i = 0; i < validRecipients.length; i++) {
      const s = validRecipients[i]!;
      const text = applyTemplate(message, s);

      let url: string;
      if (channel === "whatsapp") {
        url = whatsappUrl(text, s.parent_phone);
      } else {
        if (!s.parent_email) continue;
        url = mailtoUrl(subject || "Poruka", text, s.parent_email);
      }

      window.open(url, "_blank", "noopener,noreferrer");
      // mali delay (browser-i obično dozvoljavaju 1 popup po user-action)
      await new Promise((r) => setTimeout(r, 200));
    }
    setOpening(false);
  }

  const allSelected = selectedIds.size === students.length;
  const hasMessage = !!message.trim();
  const channelInvalidNoEmail =
    channel === "email" && validRecipients.length === 0 && selected.length > 0;

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      {/* Left: composer */}
      <div className="space-y-5">
        {/* Channel selector */}
        <div>
          <Label className="text-xs">Kanal</Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => setChannel("whatsapp")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border p-3 text-sm transition",
                channel === "whatsapp"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background hover:bg-secondary",
              )}
            >
              <MessageCircle className="size-4" strokeWidth={1.75} />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setChannel("email")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border p-3 text-sm transition",
                channel === "email"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background hover:bg-secondary",
              )}
            >
              <Mail className="size-4" strokeWidth={1.75} />
              Email (mailto)
            </button>
          </div>
        </div>

        {/* Templates */}
        <div>
          <Label className="text-xs">Šabloni</Label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplateChoice(t.body)}
                className="rounded-md border border-border bg-background hover:bg-secondary text-xs h-7 px-2.5"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Email subject */}
        {channel === "email" && (
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs">
              Naslov email-a
            </Label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="npr. Pauza časova"
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>
        )}

        {/* Message */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="message" className="text-xs">
              Poruka
            </Label>
            <span className="text-[10px] text-muted-foreground">
              Varijable:{" "}
              <code className="bg-secondary px-1 rounded">{"{ime}"}</code>
              {", "}
              <code className="bg-secondary px-1 rounded">
                {"{ime_roditelja}"}
              </code>
            </span>
          </div>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder='npr. "Pozdrav {ime_roditelja}, časovi pauziraju do ponedeljka."'
            className="text-sm"
          />
        </div>

        {/* Preview */}
        {hasMessage && previewStudent && (
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Pregled za: {previewStudent.full_name} (
              {channel === "whatsapp"
                ? previewStudent.parent_phone || "WhatsApp picker"
                : previewStudent.parent_email || "(nema email)"}
              )
            </p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {previewText}
            </p>
          </div>
        )}

        {channelInvalidNoEmail && (
          <p className="text-xs text-destructive inline-flex items-center gap-1.5">
            <AlertCircle className="size-3" strokeWidth={1.75} />
            Nijedan od izabranih nema unet email roditelja.
          </p>
        )}

        {/* Send */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            size="lg"
            onClick={sendAll}
            disabled={!hasMessage || validRecipients.length === 0 || opening}
          >
            {opening ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            ) : (
              <ExternalLink className="size-4" strokeWidth={2} />
            )}
            Otvori {validRecipients.length}{" "}
            {channel === "whatsapp" ? "WhatsApp" : "email"} prozor
            {validRecipients.length === 1 ? "" : "a"}
          </Button>
          <p className="text-[11px] text-muted-foreground max-w-xs">
            Otvara svaki razgovor u novom tab-u. Možda treba da dozvoliš
            popup-ove u browseru za ovu stranicu.
          </p>
        </div>
      </div>

      {/* Right: recipient list */}
      <aside className="space-y-2">
        <div className="flex items-center justify-between sticky top-16 bg-background pt-1 pb-2 -mt-1 z-10">
          <Label className="text-xs">
            Primaoci ({selectedIds.size} / {students.length})
          </Label>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
          >
            {allSelected ? "Demarkiraj sve" : "Izaberi sve"}
          </button>
        </div>
        <ul className="border border-border rounded-lg divide-y divide-border bg-card">
          {students.map((s) => {
            const isSelected = selectedIds.has(s.id);
            const validForChannel =
              channel === "whatsapp" ? true : !!s.parent_email;
            return (
              <li
                key={s.id}
                className={cn(
                  "px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary/40 transition",
                  isSelected && "bg-secondary/30",
                )}
                onClick={() => toggleOne(s.id)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  className="size-4 accent-foreground"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.full_name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {channel === "whatsapp" ? (
                      s.parent_phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-2.5" strokeWidth={1.75} />
                          {s.parent_phone}
                        </span>
                      ) : (
                        <span className="text-amber-700">bez broja</span>
                      )
                    ) : s.parent_email ? (
                      <span className="inline-flex items-center gap-1 truncate">
                        <Mail className="size-2.5" strokeWidth={1.75} />
                        {s.parent_email}
                      </span>
                    ) : (
                      <span className="text-amber-700">bez email-a</span>
                    )}
                  </div>
                </div>
                {isSelected && validForChannel && (
                  <Check className="size-3.5 text-emerald-700" strokeWidth={2} />
                )}
                {isSelected && !validForChannel && (
                  <Badge
                    variant="outline"
                    className="text-[9px] font-normal border-amber-300 text-amber-800 bg-amber-50"
                  >
                    skip
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
