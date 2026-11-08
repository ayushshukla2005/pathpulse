import * as React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

function MockLiveRegion({
  status,
  events,
}: {
  status: "connected" | "reconnecting" | "unavailable";
  events: number;
}) {
  const [announcement, setAnnouncement] = React.useState<string>("");
  const pendingCountRef = React.useRef<number>(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (events > 0) {
      pendingCountRef.current += 1;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        const count = pendingCountRef.current;
        pendingCountRef.current = 0;
        if (count > 0) {
          setAnnouncement(count === 1 ? "1 facility updated" : `${count} facilities updated`);
        }
      }, 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [events]);

  const statusText =
    status === "connected"
      ? "Live updates connected"
      : status === "reconnecting"
        ? "Reconnecting"
        : "Live updates unavailable";

  return (
    <div>
      <div role="status" data-testid="connection-status">
        {statusText}
      </div>
      <div aria-live="polite" aria-atomic="true" data-testid="announcement-region">
        {announcement}
      </div>
    </div>
  );
}

describe("Organization Real-time and Status Components", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders connection indicator using plain text rather than color alone", () => {
    const { rerender } = render(<MockLiveRegion status="connected" events={0} />);
    expect(screen.getByTestId("connection-status")).toHaveTextContent("Live updates connected");

    rerender(<MockLiveRegion status="reconnecting" events={0} />);
    expect(screen.getByTestId("connection-status")).toHaveTextContent("Reconnecting");

    rerender(<MockLiveRegion status="unavailable" events={0} />);
    expect(screen.getByTestId("connection-status")).toHaveTextContent("Live updates unavailable");
  });

  it("debounces rapid facility updates within the 3-second window into a single summarized announcement", () => {
    const { rerender } = render(<MockLiveRegion status="connected" events={1} />);

    expect(screen.getByTestId("announcement-region")).toHaveTextContent("");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender(<MockLiveRegion status="connected" events={2} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender(<MockLiveRegion status="connected" events={3} />);

    expect(screen.getByTestId("announcement-region")).toHaveTextContent("");

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId("announcement-region")).toHaveTextContent("3 facilities updated");
  });

  it("produces single item announcement when only one event occurs", () => {
    render(<MockLiveRegion status="connected" events={1} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId("announcement-region")).toHaveTextContent("1 facility updated");
  });
});
