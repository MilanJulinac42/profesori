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
      <div className="space-y-3">
        <div
          aria-hidden
          className="lg:hidden flex size-12 items-center justify-center rounded-2xl tile-cyan shadow-[0_12px_40px_-8px_oklch(0.78_0.16_205/0.5)]"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none">
            <path
              d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-foreground leading-tight tracking-tight">
          Dobrodošao <em className="not-italic text-brand">nazad.</em>
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
