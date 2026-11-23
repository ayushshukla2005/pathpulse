import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { GlassBadge, GlassButton, GlassCard, GlassInput, GlassPanel } from "@/components/ui/glass";

describe("Glass Design Foundation", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("forwards ref to underlying DOM elements", () => {
    const cardRef = React.createRef<HTMLDivElement>();
    const panelRef = React.createRef<HTMLDivElement>();
    const buttonRef = React.createRef<HTMLButtonElement>();
    const inputRef = React.createRef<HTMLInputElement>();
    const badgeRef = React.createRef<HTMLDivElement>();

    render(
      <div>
        <GlassCard ref={cardRef}>Card Content</GlassCard>
        <GlassPanel ref={panelRef}>Panel Content</GlassPanel>
        <GlassButton ref={buttonRef}>Button</GlassButton>
        <GlassInput ref={inputRef} aria-label="Glass Input" />
        <GlassBadge ref={badgeRef}>Badge</GlassBadge>
      </div>,
    );

    expect(cardRef.current).toBeInstanceOf(HTMLDivElement);
    expect(panelRef.current).toBeInstanceOf(HTMLDivElement);
    expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(badgeRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards className to all glass components", () => {
    render(
      <div>
        <GlassCard data-testid="card" className="custom-card-class">
          Card
        </GlassCard>
        <GlassPanel data-testid="panel" className="custom-panel-class">
          Panel
        </GlassPanel>
        <GlassButton className="custom-button-class">Custom Button</GlassButton>
        <GlassInput aria-label="Input" className="custom-input-class" />
        <GlassBadge data-testid="badge" className="custom-badge-class">
          Badge
        </GlassBadge>
      </div>,
    );

    expect(screen.getByTestId("card")).toHaveClass("custom-card-class");
    expect(screen.getByTestId("panel")).toHaveClass("custom-panel-class");
    expect(screen.getByRole("button", { name: "Custom Button" })).toHaveClass(
      "custom-button-class",
    );
    expect(screen.getByLabelText("Input")).toHaveClass("custom-input-class");
    expect(screen.getByTestId("badge")).toHaveClass("custom-badge-class");
  });

  it("applies the glass fallback class under high-contrast theme", () => {
    document.documentElement.setAttribute("data-theme", "high-contrast");

    render(
      <div>
        <GlassCard data-testid="hc-card">Card</GlassCard>
        <GlassPanel data-testid="hc-panel">Panel</GlassPanel>
        <GlassButton data-testid="hc-button">HC Button</GlassButton>
        <GlassInput data-testid="hc-input" aria-label="HC Input" />
        <GlassBadge data-testid="hc-badge">Badge</GlassBadge>
      </div>,
    );

    expect(screen.getByTestId("hc-card")).toHaveClass("glass-fallback");
    expect(screen.getByTestId("hc-panel")).toHaveClass("glass-fallback");
    expect(screen.getByTestId("hc-button")).toHaveClass("glass-fallback");
    expect(screen.getByTestId("hc-input")).toHaveClass("glass-fallback");
    expect(screen.getByTestId("hc-badge")).toHaveClass("glass-fallback");
  });

  it("applies the glass fallback class when fallback prop is passed", () => {
    render(
      <div>
        <GlassCard data-testid="fallback-card" fallback>
          Card
        </GlassCard>
        <GlassPanel data-testid="fallback-panel" fallback>
          Panel
        </GlassPanel>
        <GlassButton data-testid="fallback-button" fallback>
          Fallback Button
        </GlassButton>
        <GlassInput data-testid="fallback-input" aria-label="Fallback Input" fallback />
        <GlassBadge data-testid="fallback-badge" fallback>
          Badge
        </GlassBadge>
      </div>,
    );

    expect(screen.getByTestId("fallback-card")).toHaveClass("glass-fallback");
    expect(screen.getByTestId("fallback-panel")).toHaveClass("glass-fallback");
    expect(screen.getByTestId("fallback-button")).toHaveClass("glass-fallback");
    expect(screen.getByTestId("fallback-input")).toHaveClass("glass-fallback");
    expect(screen.getByTestId("fallback-badge")).toHaveClass("glass-fallback");
  });

  it("includes at least 2px focus ring classes on controls", () => {
    render(
      <div>
        <GlassButton>Focus Button</GlassButton>
        <GlassInput aria-label="Test Input" />
      </div>,
    );

    const button = screen.getByRole("button", { name: "Focus Button" });
    const input = screen.getByLabelText("Test Input");

    expect(button).toHaveClass("focus-visible:ring-2");
    expect(button).toHaveClass("focus-visible:ring-[var(--ring)]");
    expect(input).toHaveClass("focus-visible:ring-2");
    expect(input).toHaveClass("focus-visible:ring-[var(--ring)]");
  });

  it("sets aria-invalid when input has error", () => {
    render(<GlassInput aria-label="Error Input" error />);
    const input = screen.getByLabelText("Error Input");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass("border-[var(--destructive)]");
  });
});
