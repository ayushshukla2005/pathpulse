import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { resolveApiUrl } from "@/lib/api/client";

describe("API Tunnel & Rewrite Configuration", () => {
  it("configures next.config.ts rewrites for /api/v1/:path*", async () => {
    expect(nextConfig.rewrites).toBeDefined();
    if (nextConfig.rewrites) {
      const rewritesResult = await nextConfig.rewrites();
      const rewritesArray = Array.isArray(rewritesResult)
        ? rewritesResult
        : rewritesResult.beforeFiles || [];
      const apiRewrite = rewritesArray.find((r) => r.source === "/api/v1/:path*");
      expect(apiRewrite).toBeDefined();
      expect(apiRewrite?.destination).toContain("/api/v1/:path*");
    }
  });

  it("configures allowedDevOrigins with *.trycloudflare.com", () => {
    expect(nextConfig.allowedDevOrigins).toContain("*.trycloudflare.com");
  });

  it("resolves API endpoints to relative base paths without localhost", () => {
    const relativeVenues = resolveApiUrl("/venues");
    expect(relativeVenues).toBe("/api/v1/venues");
    expect(relativeVenues).not.toContain("localhost");
    expect(relativeVenues).not.toContain("http://");

    const endpointWithoutLeadingSlash = resolveApiUrl("routes");
    expect(endpointWithoutLeadingSlash).toBe("/api/v1/routes");

    const alreadyPrefixed = resolveApiUrl("/api/v1/health");
    expect(alreadyPrefixed).toBe("/api/v1/health");

    const exactPrefix = resolveApiUrl("/api/v1");
    expect(exactPrefix).toBe("/api/v1");
  });
});
