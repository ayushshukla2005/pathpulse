"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { AccessibilityMenu } from "./accessibility-menu";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header
        role="banner"
        className="w-full border-b-2 border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-sm"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-[var(--foreground)] hover:opacity-90"
            >
              PathPulse
            </Link>
            <Link
              href="/explore"
              className="rounded-md border-2 border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Explore
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <AccessibilityMenu />

            <nav aria-label="Main navigation" className="flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="rounded-md border-2 border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
                  >
                    Profile ({user?.name || "User"})
                  </Link>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="rounded-md border-2 border-[var(--border)] bg-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-md border-2 border-transparent px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md bg-[var(--primary)] px-4 py-1.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 shadow-sm"
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
