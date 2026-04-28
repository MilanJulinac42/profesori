"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type AuthState } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, undefined);

  return (
    <form action={action} className="space-y-7">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-medium tracking-tight">Prijava</h1>
        <p className="text-sm text-muted-foreground">Dobrodošao nazad.</p>
      </div>

      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs">
            Email
          </Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
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
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Prijava..." : "Prijavi se"}
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        Nemaš nalog?{" "}
        <Link href="/signup" className="text-foreground underline underline-offset-4">
          Kreiraj besplatno
        </Link>
      </p>
    </form>
  );
}
