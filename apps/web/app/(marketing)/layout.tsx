import Link from "next/link";
import React from "react";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <nav
        aria-label="Public section navigation"
        className="border-b border-[var(--border)] bg-[var(--muted)]/50 px-4 py-2 text-sm"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">
            Public Information & Policies
          </span>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <Link href="/" className="text-[var(--foreground)] underline-offset-4 hover:underline">
              Overview
            </Link>
            <Link
              href="/about"
              className="text-[var(--foreground)] underline-offset-4 hover:underline"
            >
              About
            </Link>
            <Link
              href="/accessibility"
              className="text-[var(--foreground)] underline-offset-4 hover:underline"
            >
              Accessibility
            </Link>
            <Link
              href="/privacy"
              className="text-[var(--foreground)] underline-offset-4 hover:underline"
            >
              Privacy Notice
            </Link>
            <Link
              href="/terms"
              className="text-[var(--foreground)] underline-offset-4 hover:underline"
            >
              Terms of Use
            </Link>
            <Link
              href="/contact"
              className="text-[var(--foreground)] underline-offset-4 hover:underline"
            >
              Contact & Feedback
            </Link>
          </div>
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
