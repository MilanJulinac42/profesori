"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js on first mount. No-op in dev to avoid caching stale
 * dev bundles. Failures are swallowed — the worker is a progressive
 * enhancement, not a hard requirement for the app to work.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Silent — registration is a best-effort feature.
        });
    };

    // Wait for load so we don't compete with initial paint.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
