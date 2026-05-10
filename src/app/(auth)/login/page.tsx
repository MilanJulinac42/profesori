"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type AuthState } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signIn,
    undefined,
  );

  return (
    <form action={action} className="space-y-7">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-foreground leading-tight">
          Dobrodošao nazad
        </h1>
        <p className="text-sm text-muted-foreground">
          Prijavi se da nastaviš sa časovima.
        </p>
      </div>

      <div className="space-y-3.5">
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
            autoComplete="current-password"
            placeholder="••••••••"
          />
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
        {pending ? "Prijava…" : "Prijavi se"}
      </button>

      <p className="text-sm text-center text-muted-foreground">
        Nemaš nalog?{" "}
        <Link
          href="/signup"
          className="text-brand font-semibold hover:underline underline-offset-4"
        >
          Kreiraj besplatno
        </Link>
      </p>
    </form>
  );
}
