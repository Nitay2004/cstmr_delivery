import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

if (process.env.STANDALONE_OUTPUT === "true") {
  nextConfig.output = "standalone";
}

export default nextConfig;