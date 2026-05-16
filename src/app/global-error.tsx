"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Root-level fallback for errors that escape the (app)/(auth) layouts —
 * e.g. a thrown error during root layout rendering. Last line of defense.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="sr">
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0d12",
          color: "#e6e7eb",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#8b8e96",
              marginBottom: 12,
            }}
          >
            Greška
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              margin: 0,
              marginBottom: 12,
              letterSpacing: "-0.02em",
            }}
          >
            Nešto je puklo.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#9ea2ad",
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            Greška je prijavljena. Probaj ponovo — ako se ponovi, javi nam.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid #2a2d35",
              background: "#e6e7eb",
              color: "#0b0d12",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Pokušaj ponovo
          </button>
          {error.digest && (
            <p
              style={{
                fontSize: 11,
                color: "#5c5f68",
                marginTop: 20,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
