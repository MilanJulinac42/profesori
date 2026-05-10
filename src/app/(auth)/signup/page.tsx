"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, type AuthState } from "../actions";

export default function SignUpPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signUp,
    undefined,
  );

  return (
    <form action={action} className="space-y-7">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tile-emerald">
          <CheckCircle2 className="size-3" strokeWidth={2.25} />
          14 dana besplatno · bez kartice
        </span>
        <h1 className="font-display text-3xl text-foreground leading-tight">
          Kreiraj nalog
        </h1>
        <p className="text-sm text-muted-foreground">
          Postavi sve za par minuta — učenici, raspored, naplata.
        </p>
      </div>

      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="text-xs">
            Ime i prezime
          </Label>
          <Input
            id="full_name"
            name="full_name"
            required
            autoComplete="name"
            placeholder="Marko Marković"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="ti@email.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs">
            Lozinka
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
          />
          <p className="text-[11px] text-muted-foreground">
            Najmanje 8 karaktera.
          </p>
        </div>
      </div>

      {state?.error && (
        <div
          className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-sm text-rose-500 dark:text-rose-400 inline-flex items-start gap-2 w-full"
          role="alert"
        >
          <AlertCircle
            className="size-4 mt-0.5 shrink-0"
            strokeWidth={2}
          />
          <span>{state.error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-opacity glow-brand disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {pending ? "Kreiranje…" : "Kreiraj nalog"}
      </button>

      <p className="text-sm text-center text-muted-foreground">
        Već imaš nalog?{" "}
        <Link
          href="/login"
          className="text-brand font-semibold hover:underline underline-offset-4"
        >
          Prijavi se
        </Link>
      </p>
    </form>
  );
}
