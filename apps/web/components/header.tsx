"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, X } from "lucide-react";
import { getNotifications } from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth/auth-context";
import { AccessibilityMenu } from "./accessibility-menu";
import { PulseLogo } from "./brand/pulse-logo";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const mobileMenuButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

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
        className="glass-panel w-full border-b border-[var(--glass-border)] bg-[var(--glass-surface)] shadow-[var(--glass-shadow)] px-4 py-3 sticky top-0 z-40 transition-colors"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-[var(--foreground)] hover:opacity-90 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-md px-1 min-h-[24px]"
            >
              <PulseLogo
                className="h-7 w-7 text-[var(--primary)] group-hover:scale-105 transition-transform"
                aria-hidden="true"
              />
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight">
                PathPulse
              </span>
            </Link>
            <nav aria-label="Desktop primary" className="hidden md:flex items-center space-x-4">
              <Link
                href="/explore"
                className="inline-flex items-center min-h-[24px] rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
              >
                Explore
              </Link>
              <Link
                href="/navigation"
                className="inline-flex items-center min-h-[24px] rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
              >
                Route Planner
              </Link>
              <Link
                href="/reports/new"
                className="inline-flex items-center min-h-[24px] rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
              >
                Report Barrier
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <AccessibilityMenu />

            <nav aria-label="Main navigation" className="hidden md:flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/notifications"
                    className="relative flex items-center gap-1.5 min-h-[24px] rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
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
                    className="inline-flex items-center min-h-[24px] rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
                  >
                    My Reports
                  </Link>

                  {user?.role === "ORGANIZATION_ADMIN" ||
                  user?.role === "SUPER_ADMIN" ||
                  (user?.organizationMemberships && user.organizationMemberships.length > 0) ? (
                    <Link
                      href="/organization"
                      className="inline-flex items-center min-h-[24px] rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
                    >
                      Organization
                    </Link>
                  ) : null}

                  <Link
                    href="/profile"
                    className="inline-flex items-center min-h-[24px] rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
                  >
                    Profile ({user?.name || "User"})
                  </Link>

                  <button
                    type="button"
                    onClick={() => logout()}
                    className="inline-flex items-center min-h-[24px] rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center min-h-[24px] rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center min-h-[24px] rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-1.5 text-sm font-bold text-[var(--primary-foreground)] shadow-xs hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-transform active:scale-95"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>

            <button
              ref={mobileMenuButtonRef}
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-panel"
              className="md:hidden inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)] p-2 text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <nav
            id="mobile-navigation-panel"
            aria-label="Mobile primary navigation"
            className="md:hidden mt-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-[var(--glass-blur)] p-4 shadow-[var(--glass-shadow)] flex flex-col space-y-2"
          >
            <Link
              href="/explore"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex items-center min-h-[24px] rounded-md px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Explore
            </Link>
            <Link
              href="/navigation"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex items-center min-h-[24px] rounded-md px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Route Planner
            </Link>
            <Link
              href="/reports/new"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex items-center min-h-[24px] rounded-md px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Report Barrier
            </Link>

            <div className="border-t border-[var(--border)] pt-2 flex flex-col space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/notifications"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center min-h-[24px] rounded-md px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    Notifications
                  </Link>
                  <Link
                    href="/reports"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center min-h-[24px] rounded-md px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    My Reports
                  </Link>
                  {user?.role === "ORGANIZATION_ADMIN" ||
                  user?.role === "SUPER_ADMIN" ||
                  (user?.organizationMemberships && user.organizationMemberships.length > 0) ? (
                    <Link
                      href="/organization"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="inline-flex items-center min-h-[24px] rounded-md px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    >
                      Organization
                    </Link>
                  ) : null}
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center min-h-[24px] rounded-md px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    Profile ({user?.name || "User"})
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="inline-flex items-center justify-start min-h-[24px] rounded-md px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] text-left"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center min-h-[24px] rounded-md px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center min-h-[24px] rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-bold text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>
        ) : null}
      </header>
    </>
  );
}
