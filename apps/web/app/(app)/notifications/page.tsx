"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNotifications, markNotificationRead } from "@/lib/api/notifications";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [announcement, setAnnouncement] = React.useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      setAnnouncement("Notification marked as read.");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (isLoading) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto px-4 py-8 focus:outline-none"
      >
        <div className="max-w-2xl mx-auto p-12 text-center text-[var(--muted-foreground)]">
          Loading notifications...
        </div>
      </main>
    );
  }

  if (isError) {
    const rawMessage = error instanceof Error ? error.message : "";
    const isProxyOrNetworkError =
      !rawMessage ||
      rawMessage.startsWith("<") ||
      rawMessage.toLowerCase().includes("econnrefused") ||
      rawMessage.toLowerCase().includes("fetch failed") ||
      rawMessage.toLowerCase().includes("failed to fetch") ||
      rawMessage.toLowerCase().includes("networkerror") ||
      rawMessage.toLowerCase().includes("proxy");

    const displayMessage = isProxyOrNetworkError
      ? "Unable to reach the notifications service. Please ensure the service is running and try again."
      : rawMessage;

    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto px-4 py-8 focus:outline-none"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          <div
            role="alert"
            className="p-5 border-2 border-red-500 rounded-lg bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"
          >
            <h1 className="text-xl font-bold">Error Loading Notifications</h1>
            <p className="mt-1 text-sm">{displayMessage}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["notifications"] })}
            >
              Retry
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const items = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="container mx-auto max-w-3xl px-4 py-8 focus:outline-none space-y-6"
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Notifications
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Status updates and actions on your reported accessibility barriers.
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
            {unreadCount} unread
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <GlassCard>
          <CardContent className="p-12 text-center text-[var(--muted-foreground)] space-y-3">
            <p>You have no notifications yet.</p>
            <Link
              href="/reports/new"
              className="inline-flex min-h-[24px] items-center text-sm font-semibold text-[var(--primary)] hover:underline"
            >
              Report an accessibility barrier
            </Link>
          </CardContent>
        </GlassCard>
      ) : (
        <ul className="space-y-4" aria-label="Notifications list">
          {items.map((item) => (
            <li key={item.id}>
              <GlassCard
                className={`transition-colors border-2 ${
                  !item.readAt ? "border-[var(--primary)]" : "border-[var(--border)]"
                }`}
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-[var(--foreground)]">
                        {item.title}
                      </CardTitle>
                      {!item.readAt && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-primary text-primary-foreground">
                          Unread
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {!item.readAt && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => markReadMutation.mutate(item.id)}
                      disabled={markReadMutation.isPending}
                      className="text-xs min-h-[24px] min-w-[24px]"
                      aria-label={`Mark "${item.title}" as read`}
                    >
                      Mark read
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-2">
                  <p className="text-sm text-[var(--foreground)]">{item.message}</p>
                  {item.link && (
                    <Link
                      href={item.link}
                      className="inline-flex min-h-[24px] items-center text-xs font-semibold text-[var(--primary)] hover:underline"
                    >
                      View Report Details &rarr;
                    </Link>
                  )}
                </CardContent>
              </GlassCard>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
