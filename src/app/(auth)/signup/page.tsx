"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, type AuthState } from "../actions";

export default function SignUpPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, undefined);

  return (
    <form action={action} className="space-y-7">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-medium tracking-tight">Kreiraj nalog</h1>
        <p className="text-sm text-muted-foreground">
          14 dana besplatno, bez kartice.
        </p>
      </div>

      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="text-xs">
            Ime i prezime
          </Label>
          <Input id="full_name" name="full_name" required autoComplete="name" />
        </div>
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
            minLength={8}
            autoComplete="new-password"
          />
          <p className="text-[11px] text-muted-foreground">Najmanje 8 karaktera.</p>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Kreiranje..." : "Kreiraj nalog"}
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        Već imaš nalog?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Prijavi se
        </Link>
      </p>
    </form>
  );
}
