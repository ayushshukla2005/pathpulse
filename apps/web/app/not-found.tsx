"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main id="main-content" className="flex-1 flex items-center justify-center py-20 px-4">
      <div className="mx-auto max-w-md text-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl glass-panel">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-3">
          Error 404
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--foreground)] mb-4 focus:outline-none font-display"
        >
          Page Not Found
        </h1>
        <p className="text-base text-[var(--muted-foreground)] leading-relaxed mb-8">
          The requested page could not be found. It may have been moved, deleted, or entered with an
          incorrect address.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-base font-bold text-[var(--primary-foreground)] shadow-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] transition-transform active:scale-95"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Return to Home</span>
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-6 py-2.5 text-base font-bold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] transition-colors"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            <span>Explore Venues</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
