import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

if (process.env.STANDALONE_OUTPUT === "true") {
  nextConfig.output = "standalone";
}

export default nextConfig;