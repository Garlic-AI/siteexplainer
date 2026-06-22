import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Summaries are persisted in Redis, so even server-rendered pages stay cheap.
  poweredByHeader: false,
  // Pin the workspace root — a parent `bun.lock` otherwise confuses Turbopack.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
