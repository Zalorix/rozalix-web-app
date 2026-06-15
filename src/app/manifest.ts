import type { MetadataRoute } from "next";

// Web App Manifest — lets clients install the Console to their home screen and
// run it full-screen like a native app. Next links this automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rozalix Console",
    short_name: "Rozalix",
    description: "CRM, CMS, and AI receptionist dashboard for your website.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#4F46E5",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
