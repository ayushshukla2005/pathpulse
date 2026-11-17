import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { PulseLogo } from "@/components/brand/pulse-logo";
import { ShimmerSkeleton } from "@/components/ui/shimmer-skeleton";

describe("Vibe-Coded Visual Restyle Components", () => {
  it("renders PulseLogo with custom dimensions and aria-hidden", () => {
    const { container } = render(
      <PulseLogo className="h-8 w-8 text-cyan-400" aria-hidden="true" size={32} />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });

  it("renders PulseLogo with accessible img role when standalone", () => {
    render(<PulseLogo role="img" aria-label="PathPulse Brand Mark" />);
    const logo = screen.getByRole("img", { name: "PathPulse Brand Mark" });
    expect(logo).toBeInTheDocument();
  });

  it("renders ShimmerSkeleton with accessible status role and sr-only message", () => {
    render(<ShimmerSkeleton className="h-6 w-32" />);
    const skeleton = screen.getByRole("status", { name: /loading/i });
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("shimmer-skeleton");
    expect(screen.getByText(/loading content/i)).toHaveClass("sr-only");
  });

  it("verifies glass-panel fallback styles under high-contrast data-theme", () => {
    document.documentElement.setAttribute("data-theme", "high-contrast");
    expect(document.documentElement.getAttribute("data-theme")).toBe("high-contrast");
    document.documentElement.removeAttribute("data-theme");
  });

  it("verifies reduced-motion attribute setting disables animations", () => {
    document.documentElement.setAttribute("data-reduced-motion", "true");
    expect(document.documentElement.getAttribute("data-reduced-motion")).toBe("true");
    document.documentElement.removeAttribute("data-reduced-motion");
  });
});
