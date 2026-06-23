import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root — a parent `bun.lock` otherwise confuses Turbopack.
  turbopack: { root: import.meta.dirname },
  // Guarantee the bundled OG fonts ship inside the image functions.
  outputFileTracingIncludes: {
    "/og": ["./lib/fonts/*.woff"],
    "/opengraph-image": ["./lib/fonts/*.woff"],
  },
};

export default nextConfig;
