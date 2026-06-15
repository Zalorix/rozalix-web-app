import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app — a stray lockfile in the home
  // directory was otherwise being inferred as the root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
