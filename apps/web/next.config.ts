import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isStandalone =
  process.env.BUILD_STANDALONE === "true" ||
  process.env.BUILD_STANDALONE === "1";

const apiInternalUrl = process.env.API_INTERNAL_URL || "http://localhost:4000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname, "../../"),
  allowedDevOrigins: ["*.trycloudflare.com"],
  ...(isStandalone ? { output: "standalone" } : {}),
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiInternalUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

