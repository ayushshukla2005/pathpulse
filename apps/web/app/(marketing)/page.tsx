import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome — Navigate Without Barriers",
};

export default function MarketingPage() {
  return (
    <main id="main-content" className="flex-1">
      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-[var(--foreground)]">
          Navigate Without Barriers
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-[var(--muted-foreground)]">
          PathPulse is an intelligent, accessibility-first navigation platform. Discover step-free
          routes, verify elevator and ramp status in real time, and navigate multi-floor public
          venues with confidence.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-md bg-[var(--primary)] px-8 py-3 text-lg font-bold text-[var(--primary-foreground)] shadow-md hover:opacity-90"
          >
            Get Started — Free
          </Link>
          <Link
            href="/login"
            className="rounded-md border-2 border-[var(--border)] bg-transparent px-8 py-3 text-lg font-bold text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="border-t-2 border-[var(--border)] bg-[var(--card)] px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-[var(--foreground)] mb-12">
            Engineered for Real-World Independence
          </h2>

          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-lg border-2 border-[var(--border)] p-6 bg-[var(--background)]">
              <h3 className="text-xl font-bold mb-2 text-[var(--foreground)]">Step-Free Routing</h3>
              <p className="text-[var(--muted-foreground)] text-base">
                Multi-floor pathfinding strictly enforces accessibility parameters: no stairs,
                manageable slopes, and doorway clearances tailored to your profile.
              </p>
            </div>

            <div className="rounded-lg border-2 border-[var(--border)] p-6 bg-[var(--background)]">
              <h3 className="text-xl font-bold mb-2 text-[var(--foreground)]">
                Real-Time Facility Status
              </h3>
              <p className="text-[var(--muted-foreground)] text-base">
                Out-of-service elevators and blocked corridors are immediately excluded from
                navigation graphs, preventing stranded journeys.
              </p>
            </div>

            <div className="rounded-lg border-2 border-[var(--border)] p-6 bg-[var(--background)]">
              <h3 className="text-xl font-bold mb-2 text-[var(--foreground)]">
                Transparent Verification
              </h3>
              <p className="text-[var(--muted-foreground)] text-base">
                Every route segment and facility clearly shows its verification level: Confirmed,
                Unverified, or Unavailable. No dangerous assumptions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
