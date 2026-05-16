"use client";

import { useEffect, useState, useTransition } from "react";
import { BellRing, BellOff, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  subscribeToPushAction,
  unsubscribeFromPushAction,
} from "@/lib/push/actions";

function urlBase64ToBytes(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

type State =
  | "loading" // initial probe
  | "unsupported" // browser can't do push (Safari iOS < 16.4 etc)
  | "not_configured" // server VAPID missing
  | "permission_denied" // user blocked
  | "idle_unsubscribed" // ready to subscribe
  | "subscribed";

export function PushCard({ publicKey }: { publicKey: string | null }) {
  const [state, setState] = useState<State>("loading");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!publicKey) {
      setState("not_configured");
      return;
    }
    if (typeof window === "undefined") return;
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    if (!supported) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("permission_denied");
      return;
    }

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        setState(existing ? "subscribed" : "idle_unsubscribed");
      } catch {
        setState("idle_unsubscribed");
      }
    })();
  }, [publicKey]);

  async function subscribe() {
    if (!publicKey) return;
    startTransition(async () => {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          setState(
            perm === "denied" ? "permission_denied" : "idle_unsubscribed",
          );
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToBytes(publicKey),
        });
        const json = sub.toJSON();
        const res = await subscribeToPushAction({
          endpoint: sub.endpoint,
          keys: {
            p256dh: json.keys?.p256dh ?? "",
            auth: json.keys?.auth ?? "",
          },
          userAgent: navigator.userAgent,
        });
        if (!res.ok) {
          toast.error("Greška", { description: res.error });
          return;
        }
        setState("subscribed");
        toast.success("Push obaveštenja uključena");
      } catch (err) {
        toast.error("Greška pri uključivanju", {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    });
  }

  async function unsubscribe() {
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) {
          setState("idle_unsubscribed");
          return;
        }
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await unsubscribeFromPushAction(endpoint);
        setState("idle_unsubscribed");
        toast.success("Push obaveštenja isključena");
      } catch (err) {
        toast.error("Greška", {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    });
  }

  return (
    <section className="card-elevated card-glow rounded-2xl p-5 space-y-4">
      <header className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl tile-amber shrink-0">
          {state === "subscribed" ? (
            <BellRing className="size-5" strokeWidth={2} />
          ) : (
            <BellOff className="size-5" strokeWidth={2} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">
            Push obaveštenja
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stigne ti notifikacija na ovaj uređaj kad se desi nešto bitno —
            nov upit od roditelja, domaći predat, izveštaj poslat.
          </p>
        </div>
        <PushToggleButton
          state={state}
          onSubscribe={subscribe}
          onUnsubscribe={unsubscribe}
        />
      </header>

      <StateHint state={state} />
    </section>
  );
}

function PushToggleButton({
  state,
  onSubscribe,
  onUnsubscribe,
}: {
  state: State;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
}) {
  if (state === "loading") {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
      </Button>
    );
  }
  if (
    state === "unsupported" ||
    state === "not_configured" ||
    state === "permission_denied"
  ) {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        Uključi
      </Button>
    );
  }
  if (state === "subscribed") {
    return (
      <Button type="button" variant="outline" size="sm" onClick={onUnsubscribe}>
        Isključi
      </Button>
    );
  }
  return (
    <Button type="button" size="sm" onClick={onSubscribe}>
      Uključi
    </Button>
  );
}

function StateHint({ state }: { state: State }) {
  if (state === "subscribed") return null;
  let message: string;
  switch (state) {
    case "unsupported":
      message =
        "Tvoj browser ne podržava Web Push. Pokušaj iz Chrome-a, Firefox-a ili Safari-ja na iOS 16.4+.";
      break;
    case "not_configured":
      message =
        "Push notifikacije još nisu konfigurisane na serveru (VAPID ključevi nedostaju).";
      break;
    case "permission_denied":
      message =
        "Blokiran/a si push obaveštenja u browser-u. Otvori site settings → Notifikacije → Allow.";
      break;
    case "idle_unsubscribed":
    case "loading":
      return null;
  }
  return (
    <p className="text-[11px] text-muted-foreground inline-flex items-start gap-1.5">
      <AlertTriangle className="size-3 mt-0.5 shrink-0" strokeWidth={2} />
      {message}
    </p>
  );
}
