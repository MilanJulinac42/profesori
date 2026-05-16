import { ImageResponse } from "next/og";

// Force PNG output served at /icon.
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

/**
 * Auto-generated 192x192 icon (PWA + favicon). Brand-coloured square with
 * a large "P" — replace with a designed asset later by dropping a static
 * file at app/icon.png.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, oklch(0.18 0.035 268), oklch(0.32 0.08 205))",
          fontSize: 132,
          fontWeight: 700,
          color: "oklch(0.96 0.01 265)",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          letterSpacing: "-0.05em",
        }}
      >
        P
      </div>
    ),
    { ...size },
  );
}
