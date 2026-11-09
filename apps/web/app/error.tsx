"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main id="main-content" className="flex-1 flex items-center justify-center py-16 px-4">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-red-600 mb-2">
          Application Error
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--foreground)] mb-4 focus:outline-none"
        >
          Something Went Wrong
        </h1>
        <p className="text-base text-[var(--muted-foreground)] leading-relaxed mb-8">
          An unexpected technical error occurred while loading this page. Our team has been
          notified.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-[var(--primary)] px-6 py-2.5 text-base font-bold text-[var(--primary-foreground)] shadow hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-md border-2 border-[var(--border)] bg-transparent px-6 py-2.5 text-base font-bold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
