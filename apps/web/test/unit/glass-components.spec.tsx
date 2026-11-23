import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "@/components/venues/empty-state";
import { VenueList } from "@/components/venues/venue-list";
import { GlassDialog, GlassButton } from "@/components/ui/glass";
import { VerificationBadge } from "@/components/venues/verification-badge";

describe("Glass Components - Auth, Navigation, and Explore", () => {
  it("renders empty state with exact wording 'No venues within this radius'", () => {
    render(
      <EmptyState
        title="No venues within this radius"
        description="Try a larger radius or remove the step-free filter to find more venues."
      />,
    );

    const heading = screen.getByRole("heading", { name: "No venues within this radius" });
    expect(heading).toBeInTheDocument();
    expect(
      screen.getByText("Try a larger radius or remove the step-free filter to find more venues."),
    ).toBeInTheDocument();

    const region = screen.getByRole("region", { name: "No results" });
    expect(region).toHaveClass("glass-card");
  });

  it("VenueList renders EmptyState with 'No venues within this radius' when empty", () => {
    render(<VenueList venues={[]} />);
    expect(screen.getByText("No venues within this radius")).toBeInTheDocument();
  });

  it("traps focus inside the dialog when navigating with Tab and Shift+Tab", () => {
    function TestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
      return (
        <GlassDialog open={open} onClose={onClose} title="Test Dialog Focus Trap">
          <button type="button" data-testid="btn-first">
            First Button
          </button>
          <button type="button" data-testid="btn-second">
            Second Button
          </button>
        </GlassDialog>
      );
    }

    render(<TestDialog open={true} onClose={vi.fn()} />);

    const firstBtn = screen.getByTestId("btn-first");
    const secondBtn = screen.getByTestId("btn-second");

    expect(document.activeElement).toBe(firstBtn);

    secondBtn.focus();
    expect(document.activeElement).toBe(secondBtn);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(firstBtn);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(secondBtn);
  });

  it("closes the dialog on Escape and restores focus to the trigger", () => {
    function TestDialogWorkflow() {
      const [isOpen, setIsOpen] = React.useState(false);
      const triggerRef = React.useRef<HTMLButtonElement>(null);

      return (
        <div>
          <button
            ref={triggerRef}
            type="button"
            data-testid="trigger-btn"
            onClick={() => setIsOpen(true)}
          >
            Open Dialog
          </button>

          <GlassDialog
            open={isOpen}
            onClose={() => setIsOpen(false)}
            triggerRef={triggerRef}
            title="Escape Test Dialog"
          >
            <GlassButton type="button" data-testid="close-btn" onClick={() => setIsOpen(false)}>
              Close
            </GlassButton>
          </GlassDialog>
        </div>
      );
    }

    render(<TestDialogWorkflow />);

    const triggerBtn = screen.getByTestId("trigger-btn");
    triggerBtn.focus();
    expect(document.activeElement).toBe(triggerBtn);

    fireEvent.click(triggerBtn);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const closeBtn = screen.getByTestId("close-btn");
    expect(document.activeElement).toBe(closeBtn);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(triggerBtn);
  });

  it("renders verification badges with GlassBadge and correct text", () => {
    const { rerender } = render(<VerificationBadge level="CONFIRMED" />);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Confirmed").closest(".glass-badge")).toBeInTheDocument();

    rerender(<VerificationBadge level="UNVERIFIED" />);
    expect(screen.getByText("Unverified")).toBeInTheDocument();

    rerender(<VerificationBadge level="UNAVAILABLE" />);
    expect(screen.getByText("Unavailable")).toBeInTheDocument();

    rerender(<VerificationBadge level="CONFIRMED" status="OUT_OF_SERVICE" />);
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });
});
