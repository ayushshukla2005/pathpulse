"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function NotFound() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main id="main-content" className="flex-1 flex items-center justify-center py-16 px-4">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-[var(--primary)] mb-2">
          Error 404
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--foreground)] mb-4 focus:outline-none"
        >
          Page Not Found
        </h1>
        <p className="text-base text-[var(--muted-foreground)] leading-relaxed mb-8">
          The requested page could not be found. It may have been moved, deleted, or entered with an
          incorrect address.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/"
            className="rounded-md bg-[var(--primary)] px-6 py-2.5 text-base font-bold text-[var(--primary-foreground)] shadow hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
          >
            Return to Home
          </Link>
          <Link
            href="/explore"
            className="rounded-md border-2 border-[var(--border)] bg-transparent px-6 py-2.5 text-base font-bold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
          >
            Explore Venues
          </Link>
        </div>
      </div>
    </main>
  );
}
