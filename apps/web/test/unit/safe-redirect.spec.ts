import { describe, expect, it } from "vitest";
import { validateSafeNextPath } from "@/lib/auth/safe-redirect";

describe("validateSafeNextPath", () => {
  it("allows valid relative root-relative paths", () => {
    expect(validateSafeNextPath("/profile")).toBe("/profile");
    expect(validateSafeNextPath("/venues/123")).toBe("/venues/123");
    expect(validateSafeNextPath("/profile?tab=preferences&active=true")).toBe(
      "/profile?tab=preferences&active=true",
    );
  });

  it("rejects protocol-relative double-slash URLs and returns fallback", () => {
    expect(validateSafeNextPath("//evil.com")).toBe("/profile");
    expect(validateSafeNextPath("//google.com/phishing")).toBe("/profile");
  });

  it("rejects backslash evasion attempts", () => {
    expect(validateSafeNextPath("/\\evil.com")).toBe("/profile");
    expect(validateSafeNextPath("\\profile")).toBe("/profile");
    expect(validateSafeNextPath("/profile\\test")).toBe("/profile");
  });

  it("rejects absolute URLs with scheme protocols", () => {
    expect(validateSafeNextPath("http://evil.com")).toBe("/profile");
    expect(validateSafeNextPath("https://evil.com")).toBe("/profile");
    expect(validateSafeNextPath("javascript:alert(1)")).toBe("/profile");
    expect(validateSafeNextPath("data:text/html,evil")).toBe("/profile");
  });

  it("rejects embedded protocols", () => {
    expect(validateSafeNextPath("/http://evil.com")).toBe("/profile");
    expect(validateSafeNextPath("/https://evil.com")).toBe("/profile");
  });

  it("returns fallback for null, undefined, or empty string", () => {
    expect(validateSafeNextPath(null)).toBe("/profile");
    expect(validateSafeNextPath(undefined)).toBe("/profile");
    expect(validateSafeNextPath("")).toBe("/profile");
    expect(validateSafeNextPath("   ")).toBe("/profile");
  });

  it("honors custom fallback when provided", () => {
    expect(validateSafeNextPath("//evil.com", "/dashboard")).toBe("/dashboard");
    expect(validateSafeNextPath("invalid", "/custom")).toBe("/custom");
  });
});
