import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Profesori — alat za privatne časove",
    short_name: "Profesori",
    description:
      "SaaS za solo profesore privatnih časova — učenici, raspored, naplata, AI asistent.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0d12",
    theme_color: "#0b0d12",
    lang: "sr",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        url: "/dashboard",
      },
      {
        name: "Raspored",
        short_name: "Raspored",
        url: "/schedule",
      },
      {
        name: "Učenici",
        short_name: "Učenici",
        url: "/students",
      },
      {
        name: "AI Asistent",
        short_name: "Asistent",
        url: "/asistent",
      },
    ],
  };
}
