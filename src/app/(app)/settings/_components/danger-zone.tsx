"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccount } from "@/lib/settings/actions";

const CONFIRM_PHRASE = "OBRIŠI";

export function DangerZone({ teacherName }: { teacherName: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (confirm.trim() !== CONFIRM_PHRASE) return;
    startTransition(async () => {
      try {
        await deleteAccount();
      } catch (e) {
        toast.error("Brisanje nije uspelo", {
          description: (e as Error).message,
        });
      }
    });
  }

  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 overflow-hidden">
      <div className="px-5 py-4 border-b border-destructive/30">
        <h2 className="text-base font-medium inline-flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-4" strokeWidth={1.75} />
          Opasna zona
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ireverzibilne akcije.
        </p>
      </div>
      <div className="px-5 py-5 space-y-3">
        <div>
          <p className="text-sm font-medium">Obriši nalog</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Trajno briše tvoj nalog, sve učenike, časove, uplate, opomene i
            javni profil. Nema undo. Pre brisanja preporuka — preuzmi eksport
            podataka.
          </p>
        </div>

        {!open ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(true)}
            className="text-destructive hover:text-destructive border-destructive/40 hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
            Obriši nalog
          </Button>
        ) : (
          <div className="space-y-3 rounded-lg border border-destructive/40 bg-background p-4">
            <p className="text-sm">
              <span className="font-medium">{teacherName}</span>, ovo briše sve.
              Da bi potvrdio, ukucaj{" "}
              <span className="font-mono font-medium">{CONFIRM_PHRASE}</span>:
            </p>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete" className="sr-only">
                Potvrdi brisanje
              </Label>
              <Input
                id="confirm-delete"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                className="h-10 text-sm font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={pending || confirm.trim() !== CONFIRM_PHRASE}
              >
                {pending
                  ? "Brisanje..."
                  : "Definitivno obriši nalog"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setConfirm("");
                }}
              >
                Odustani
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
