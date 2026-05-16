import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      // Audio uploads (voice notes) ~2.4 MB; homework images do 5 × 800 KB ≈ 4 MB.
      bodySizeLimit: "10mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

// Sentry wraps the config to add source-map upload + tunneling. If no DSN,
// the runtime SDKs no-op so this remains zero-impact until you add envs:
//   SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN (for source maps).
export default withSentryConfig(nextConfig, {
  // Skip source-map upload when credentials aren't set; otherwise build fails
  // on a fresh checkout without the auth token.
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Don't ship source maps to the browser — they're uploaded to Sentry only.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  disableLogger: true,
});
