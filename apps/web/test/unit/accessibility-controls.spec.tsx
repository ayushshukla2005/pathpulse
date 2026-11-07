import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { A11yProvider } from "@/lib/a11y/a11y-context";
import { AccessibilityMenu } from "@/components/accessibility-menu";

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ user: null }),
}));

describe("AccessibilityMenu Component", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-reduced-motion");
    document.documentElement.style.removeProperty("--text-scale");
    document.cookie = "pp_a11y=; max-age=0";
  });

  it("renders menu button and expands controls on click", () => {
    render(
      <A11yProvider>
        <AccessibilityMenu />
      </A11yProvider>,
    );

    const button = screen.getByRole("button", { name: /accessibility/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    expect(screen.getByLabelText(/text size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/high contrast/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reduced motion/i)).toBeInTheDocument();
  });

  it("updates root --text-scale property when text size is selected", async () => {
    render(
      <A11yProvider>
        <AccessibilityMenu />
      </A11yProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /accessibility/i }));
    const select = screen.getByLabelText(/text size/i);

    fireEvent.change(select, { target: { value: "1.25" } });

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--text-scale")).toBe("1.25");
    });

    const liveRegion = document.getElementById("a11y-live-region");
    expect(liveRegion).toHaveTextContent(/text scale set to large/i);
  });

  it("toggles high-contrast data-theme attribute on root element", async () => {
    render(
      <A11yProvider>
        <AccessibilityMenu />
      </A11yProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /accessibility/i }));
    const checkbox = screen.getByLabelText(/high contrast/i);

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "high-contrast");
    });

    const liveRegion = document.getElementById("a11y-live-region");
    expect(liveRegion).toHaveTextContent(/high contrast enabled/i);

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(document.documentElement).not.toHaveAttribute("data-theme");
    });
    expect(liveRegion).toHaveTextContent(/high contrast disabled/i);
  });

  it("toggles reduced motion attribute on root element", async () => {
    render(
      <A11yProvider>
        <AccessibilityMenu />
      </A11yProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /accessibility/i }));
    const checkbox = screen.getByLabelText(/reduced motion/i);

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-reduced-motion", "true");
    });

    const liveRegion = document.getElementById("a11y-live-region");
    expect(liveRegion).toHaveTextContent(/reduced motion enabled/i);
  });
});
