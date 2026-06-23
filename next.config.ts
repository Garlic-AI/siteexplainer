import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root — a parent `bun.lock` otherwise confuses Turbopack.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
