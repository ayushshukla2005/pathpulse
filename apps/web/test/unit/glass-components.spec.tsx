import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "@/components/venues/empty-state";
import { VenueList } from "@/components/venues/venue-list";
import { GlassDialog, GlassButton, GlassPanel } from "@/components/ui/glass";
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

  it("tabs handle ArrowRight, ArrowLeft, Home, and End key navigation with roving tabIndex and aria-selected", () => {
    function TestTabs() {
      const tabs = [
        { id: "account", label: "Account" },
        { id: "navigation", label: "Navigation" },
        { id: "accessibility", label: "Accessibility" },
      ];
      const [activeTab, setActiveTab] = React.useState("account");
      const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

      const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        let newIndex = index;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          newIndex = (index + 1) % tabs.length;
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          newIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (e.key === "Home") {
          e.preventDefault();
          newIndex = 0;
        } else if (e.key === "End") {
          e.preventDefault();
          newIndex = tabs.length - 1;
        } else {
          return;
        }

        const target = tabs[newIndex];
        if (target) {
          setActiveTab(target.id);
          tabRefs.current[newIndex]?.focus();
        }
      };

      return (
        <div>
          <div role="tablist" aria-label="Preferences">
            {tabs.map((tab, idx) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[idx] = el;
                  }}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              role="tabpanel"
              id={`panel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              hidden={activeTab !== tab.id}
            >
              Content for {tab.label}
            </div>
          ))}
        </div>
      );
    }

    render(<TestTabs />);

    const accountTab = screen.getByRole("tab", { name: "Account" });
    const navigationTab = screen.getByRole("tab", { name: "Navigation" });
    const accessibilityTab = screen.getByRole("tab", { name: "Accessibility" });

    expect(accountTab).toHaveAttribute("aria-selected", "true");
    expect(accountTab).toHaveAttribute("tabindex", "0");
    expect(navigationTab).toHaveAttribute("aria-selected", "false");
    expect(navigationTab).toHaveAttribute("tabindex", "-1");
    expect(accessibilityTab).toHaveAttribute("aria-selected", "false");
    expect(accessibilityTab).toHaveAttribute("tabindex", "-1");

    accountTab.focus();
    expect(document.activeElement).toBe(accountTab);

    fireEvent.keyDown(accountTab, { key: "ArrowRight" });
    expect(navigationTab).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(navigationTab);

    fireEvent.keyDown(navigationTab, { key: "ArrowRight" });
    expect(accessibilityTab).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(accessibilityTab);

    fireEvent.keyDown(accessibilityTab, { key: "ArrowRight" });
    expect(accountTab).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(accountTab);

    fireEvent.keyDown(accountTab, { key: "ArrowLeft" });
    expect(accessibilityTab).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(accessibilityTab);

    fireEvent.keyDown(accessibilityTab, { key: "Home" });
    expect(accountTab).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(accountTab);

    fireEvent.keyDown(accountTab, { key: "End" });
    expect(accessibilityTab).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(accessibilityTab);
  });

  it("sortable table toggles aria-sort between none, ascending, and descending", () => {
    function TestSortableTable() {
      type SortDir = "asc" | "desc" | null;
      const [sortCol, setSortCol] = React.useState<string | null>(null);
      const [sortDir, setSortDir] = React.useState<SortDir>(null);

      const handleSort = (colKey: string) => {
        if (sortCol !== colKey) {
          setSortCol(colKey);
          setSortDir("asc");
        } else if (sortDir === "asc") {
          setSortDir("desc");
        } else {
          setSortCol(null);
          setSortDir(null);
        }
      };

      const getAriaSort = (colKey: string): "none" | "ascending" | "descending" => {
        if (sortCol !== colKey) return "none";
        if (sortDir === "asc") return "ascending";
        if (sortDir === "desc") return "descending";
        return "none";
      };

      return (
        <GlassPanel>
          <table>
            <thead>
              <tr>
                <th aria-sort={getAriaSort("name")}>
                  <button type="button" onClick={() => handleSort("name")}>
                    Facility Name
                  </button>
                </th>
                <th aria-sort={getAriaSort("type")}>
                  <button type="button" onClick={() => handleSort("type")}>
                    Type
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Main Elevator</td>
                <td>Elevator</td>
              </tr>
            </tbody>
          </table>
        </GlassPanel>
      );
    }

    render(<TestSortableTable />);

    const nameHeader = screen.getByRole("columnheader", { name: /Facility Name/i });
    const typeHeader = screen.getByRole("columnheader", { name: /Type/i });
    const nameBtn = screen.getByRole("button", { name: /Facility Name/i });
    const typeBtn = screen.getByRole("button", { name: /Type/i });

    expect(nameHeader).toHaveAttribute("aria-sort", "none");
    expect(typeHeader).toHaveAttribute("aria-sort", "none");

    fireEvent.click(nameBtn);
    expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
    expect(typeHeader).toHaveAttribute("aria-sort", "none");

    fireEvent.click(nameBtn);
    expect(nameHeader).toHaveAttribute("aria-sort", "descending");
    expect(typeHeader).toHaveAttribute("aria-sort", "none");

    fireEvent.click(nameBtn);
    expect(nameHeader).toHaveAttribute("aria-sort", "none");
    expect(typeHeader).toHaveAttribute("aria-sort", "none");

    fireEvent.click(nameBtn);
    expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
    fireEvent.click(typeBtn);
    expect(nameHeader).toHaveAttribute("aria-sort", "none");
    expect(typeHeader).toHaveAttribute("aria-sort", "ascending");
  });
});
