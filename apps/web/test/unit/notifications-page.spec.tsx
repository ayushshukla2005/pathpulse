import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotificationsPage from "@/app/(app)/notifications/page";
import * as notificationsApi from "@/lib/api/notifications";

vi.mock("@/lib/api/notifications", () => ({
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
}));

describe("NotificationsPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  function renderWithClient(ui: React.ReactElement) {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  }

  it("displays a clear user-friendly error state instead of a raw proxy log line when proxy fails", async () => {
    vi.mocked(notificationsApi.getNotifications).mockRejectedValueOnce(
      new Error("connect ECONNREFUSED 127.0.0.1:4000"),
    );

    renderWithClient(<NotificationsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /error loading notifications/i }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Unable to reach the notifications service. Please ensure the service is running and try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/connect ECONNREFUSED/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("renders notifications list when service call succeeds", async () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValueOnce({
      items: [
        {
          id: "notif-1",
          reportId: "rep-1",
          title: "Report Status Updated",
          message: "Your barrier report has been verified.",
          type: "STATUS_CHANGE",
          link: "/reports/rep-1",
          readAt: null,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    });

    renderWithClient(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    });

    expect(screen.getByText("Report Status Updated")).toBeInTheDocument();
    expect(screen.getByText("Your barrier report has been verified.")).toBeInTheDocument();
    expect(screen.getByText("1 unread")).toBeInTheDocument();
  });
});
