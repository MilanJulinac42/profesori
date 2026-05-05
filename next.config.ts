import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Audio uploads (voice notes) — ~64 kbps × 5 min ≈ 2.4 MB. 10 MB headroom.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
