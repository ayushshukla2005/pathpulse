import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SegmentConfidenceBadge } from "@/components/navigation/segment-confidence-badge";
import { NoConfirmedRouteState } from "@/components/navigation/no-confirmed-route-state";
import { RouteSummary } from "@/components/navigation/route-summary";

describe("Navigation Components", () => {
  describe("SegmentConfidenceBadge", () => {
    it('renders the text "Unverified" for UNVERIFIED segments', () => {
      const { unmount } = render(<SegmentConfidenceBadge confidence="UNVERIFIED" />);
      expect(screen.getByText("Unverified")).toBeInTheDocument();
      unmount();
    });

    it('renders the text "Confirmed" for CONFIRMED segments', () => {
      const { unmount } = render(<SegmentConfidenceBadge confidence="CONFIRMED" />);
      expect(screen.getByText("Confirmed")).toBeInTheDocument();
      unmount();
    });

    it('renders the text "Unavailable" for UNAVAILABLE segments', () => {
      const { unmount } = render(<SegmentConfidenceBadge confidence="UNAVAILABLE" />);
      expect(screen.getByText("Unavailable")).toBeInTheDocument();
      unmount();
    });
  });

  describe("NoConfirmedRouteState", () => {
    it("renders the reason and three next actions, and does not render any step list", () => {
      const onChooseDifferentProfile = vi.fn();
      const testReason = "Route contains out of service lift and cannot be completed.";

      const { container, unmount } = render(
        <NoConfirmedRouteState
          reason={testReason}
          onChooseDifferentProfile={onChooseDifferentProfile}
        />,
      );

      expect(
        screen.getByRole("region", { name: /No Confirmed Route Available/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(testReason)).toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: /Choose a different mobility profile/i }),
      ).toBeInTheDocument();

      expect(screen.getByText(/Contact venue:/i)).toBeInTheDocument();

      const reportLink = screen.getByRole("link", { name: /Report an accessibility barrier/i });
      expect(reportLink).toBeInTheDocument();
      expect(reportLink).toHaveAttribute("href", "/reports/new");

      expect(container.querySelector("ol")).toBeNull();
      expect(screen.queryByText(/^Step 1\b/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Navigation Instructions/i)).not.toBeInTheDocument();

      unmount();
    });
  });

  describe("RouteSummary", () => {
    it('never shows "step-free" when accessibility is not STEP_FREE', () => {
      const { unmount } = render(
        <RouteSummary totalDistanceMeters={120} accessibility="MIXED" unverifiedCount={0} />,
      );

      const mixedBadge = screen.getByText(/Mixed Access Route/i);
      expect(mixedBadge).toBeInTheDocument();
      expect(screen.queryByText(/step-free/i)).not.toBeInTheDocument();

      unmount();
    });

    it('never shows "step-free" when accessibility is UNVERIFIED', () => {
      const { unmount } = render(
        <RouteSummary totalDistanceMeters={80} accessibility="UNVERIFIED" unverifiedCount={2} />,
      );

      expect(screen.getByText(/Unverified Accessibility Route/i)).toBeInTheDocument();
      expect(screen.queryByText(/step-free/i)).not.toBeInTheDocument();

      unmount();
    });

    it('shows "Confirmed Step-Free Route" when accessibility is STEP_FREE and all segments are confirmed', () => {
      const { unmount } = render(
        <RouteSummary totalDistanceMeters={64} accessibility="STEP_FREE" unverifiedCount={0} />,
      );

      expect(screen.getByText(/Confirmed Step-Free Route/i)).toBeInTheDocument();
      expect(screen.getByText(/All segments confirmed/i)).toBeInTheDocument();

      unmount();
    });
  });
});
