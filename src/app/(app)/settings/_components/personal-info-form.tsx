"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhotoUpload } from "@/components/photo-upload";
import {
  updatePersonalInfo,
  changePassword,
  type FormState,
} from "@/lib/settings/actions";

export function PersonalInfoCard({
  organizationId,
  initialName,
  initialPhone,
  initialAvatar,
  email,
}: {
  organizationId: string;
  initialName: string;
  initialPhone: string;
  initialAvatar: string;
  email: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-medium">Lični podaci</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tvoje ime i kontakt — interno za platformu.
        </p>
      </div>
      <PersonalInfoForm
        organizationId={organizationId}
        initialName={initialName}
        initialPhone={initialPhone}
        initialAvatar={initialAvatar}
        email={email}
      />
      <PasswordForm />
    </div>
  );
}

function PersonalInfoForm({
  organizationId,
  initialName,
  initialPhone,
  initialAvatar,
  email,
}: {
  organizationId: string;
  initialName: string;
  initialPhone: string;
  initialAvatar: string;
  email: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updatePersonalInfo,
    undefined,
  );

  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);

  const saved =
    !pending && state !== undefined && !state.error && !state.fieldErrors;

  return (
    <form action={action} className="px-5 py-5 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="full_name" className="text-sm font-medium">
          Ime i prezime
        </Label>
        <Input
          id="full_name"
          name="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="h-10 text-sm"
          aria-invalid={!!state?.fieldErrors?.full_name}
        />
        {state?.fieldErrors?.full_name && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.full_name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-display" className="text-sm font-medium">
          Email
        </Label>
        <Input
          id="email-display"
          value={email}
          disabled
          className="h-10 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Email se trenutno ne može menjati. Kontaktiraj nas ako treba.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium">
          Telefon
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+381 64 123 4567"
          className="h-10 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Profilna slika</Label>
        <PhotoUpload
          orgId={organizationId}
          value={avatarUrl}
          onChange={setAvatarUrl}
          fallbackName={fullName || "?"}
        />
        <input type="hidden" name="avatar_url" value={avatarUrl} />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Čuvanje..." : "Sačuvaj"}
        </Button>
        {saved && (
          <span className="text-xs text-muted-foreground">Sačuvano.</span>
        )}
      </div>
    </form>
  );
}

function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    changePassword,
    undefined,
  );
  const [pwd, setPwd] = useState("");

  const saved =
    !pending && state !== undefined && !state.error && !state.fieldErrors;

  return (
    <form
      action={(fd) => {
        action(fd);
      }}
      className="border-t border-border px-5 py-5 space-y-4"
    >
      <div>
        <h3 className="text-sm font-medium">Promena lozinke</h3>
      </div>
      <div className="space-y-2">
        <Label htmlFor="new_password" className="text-sm font-medium">
          Nova lozinka
        </Label>
        <Input
          id="new_password"
          name="new_password"
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          minLength={8}
          autoComplete="new-password"
          placeholder="Najmanje 8 karaktera"
          className="h-10 text-sm"
          aria-invalid={!!state?.fieldErrors?.new_password}
        />
        {state?.fieldErrors?.new_password && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.new_password}
          </p>
        )}
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="outline"
          disabled={pending || pwd.length < 8}
        >
          {pending ? "Menja..." : "Promeni lozinku"}
        </Button>
        {saved && (
          <span className="text-xs text-muted-foreground">
            Lozinka promenjena.
          </span>
        )}
      </div>
    </form>
  );
}
