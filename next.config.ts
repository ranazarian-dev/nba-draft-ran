import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow server-side fetch to Basketball-Reference for draft refresh.
  serverExternalPackages: ["cheerio"],
};

export default nextConfig;
