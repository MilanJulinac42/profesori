import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS home-screen icon — same design as /icon.tsx, slightly smaller.
 * iOS applies its own rounded mask, so we leave corners square.
 */
export default function AppleIcon() {
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
          fontSize: 124,
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
