"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { getNotifications } from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth/auth-context";
import { AccessibilityMenu } from "./accessibility-menu";
import { PulseLogo } from "./brand/pulse-logo";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header
        role="banner"
        className="w-full border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md px-4 py-3 shadow-xs sticky top-0 z-40 transition-colors"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-[var(--foreground)] hover:opacity-90 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-md px-1"
            >
              <PulseLogo
                className="h-7 w-7 text-[var(--primary)] group-hover:scale-105 transition-transform"
                aria-hidden="true"
              />
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight">
                PathPulse
              </span>
            </Link>
            <Link
              href="/explore"
              className="rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/navigation"
              className="rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
            >
              Route Planner
            </Link>
            <Link
              href="/reports/new"
              className="rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
            >
              Report Barrier
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <AccessibilityMenu />

            <nav aria-label="Main navigation" className="flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/notifications"
                    className="relative flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
                    aria-label={`Notifications${
                      notificationsData?.unreadCount
                        ? `, ${notificationsData.unreadCount} unread`
                        : ""
                    }`}
                  >
                    <Bell className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                    <span>Notifications</span>
                    {notificationsData && notificationsData.unreadCount > 0 ? (
                      <span
                        className="ml-1 inline-flex items-center justify-center rounded-full bg-red-600 px-1.5 py-0.2 text-xs font-bold text-white shadow-xs"
                        aria-hidden="true"
                      >
                        {notificationsData.unreadCount}
                      </span>
                    ) : null}
                  </Link>

                  <Link
                    href="/reports"
                    className="rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
                  >
                    My Reports
                  </Link>

                  {user?.role === "ORGANIZATION_ADMIN" ||
                  user?.role === "SUPER_ADMIN" ||
                  (user?.organizationMemberships && user.organizationMemberships.length > 0) ? (
                    <Link
                      href="/organization"
                      className="rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
                    >
                      Organization
                    </Link>
                  ) : null}

                  <Link
                    href="/profile"
                    className="rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
                  >
                    Profile ({user?.name || "User"})
                  </Link>

                  <button
                    type="button"
                    onClick={() => logout()}
                    className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-1.5 text-sm font-bold text-[var(--primary-foreground)] shadow-xs hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-transform active:scale-95"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
