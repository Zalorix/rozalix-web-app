import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app — a stray lockfile in the home
  // directory was otherwise being inferred as the root.
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        // Always serve the latest service worker (never cache it), so PWA
        // updates roll out immediately. Note: we deliberately do NOT set a
        // global X-Frame-Options/frame-ancestors here — the embeddable chat
        // widget (/embed) must remain framable by client websites.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
