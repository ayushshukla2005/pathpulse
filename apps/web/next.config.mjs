import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isStandalone =
  process.env.BUILD_STANDALONE === "true" ||
  process.env.BUILD_STANDALONE === "1";

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname, "../../"),
  ...(isStandalone ? { output: "standalone" } : {}),
};

export default nextConfig;
