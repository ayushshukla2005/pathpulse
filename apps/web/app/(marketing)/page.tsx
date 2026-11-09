import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PathPulse — Accessibility-Aware Indoor Navigation",
  description:
    "Discover verified facilities, plan multi-floor step-free routes with explicit confidence labels, and report physical barriers with human moderation.",
};

export default function MarketingPage() {
  return (
    <main id="main-content" className="flex-1">
      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-[var(--foreground)]">
          Indoor Navigation With Real-World Verification
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-[var(--muted-foreground)] leading-relaxed">
          Navigating modern campuses and multi-floor buildings often breaks down when elevators
          fail, ramps are obstructed, or accessibility claims go unverified. PathPulse maps indoor
          and outdoor facilities with transparent verification levels, calculates step-free routes,
          and tracks maintenance in real time.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/explore"
            className="rounded-md bg-[var(--primary)] px-8 py-3 text-lg font-bold text-[var(--primary-foreground)] shadow-md hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
          >
            Explore Venues
          </Link>
          <Link
            href="/register"
            className="rounded-md border-2 border-[var(--border)] bg-transparent px-8 py-3 text-lg font-bold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      <section className="border-t-2 border-[var(--border)] bg-[var(--card)] px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-[var(--foreground)] mb-12">
            How PathPulse Works
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border-2 border-[var(--border)] p-6 bg-[var(--background)] flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-3 text-[var(--foreground)]">
                  1. Verified Facilities
                </h3>
                <p className="text-[var(--muted-foreground)] text-sm leading-relaxed mb-4">
                  Every facility—including elevators, accessible entrances, restrooms, and
                  ramps—displays its operational state and verification level:
                </p>
                <ul className="space-y-2 text-xs font-semibold">
                  <li className="flex items-center text-green-800 dark:text-green-300">
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-green-600 mr-2"
                      aria-hidden="true"
                    ></span>
                    Confirmed: Verified by facility managers
                  </li>
                  <li className="flex items-center text-amber-800 dark:text-amber-300">
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-amber-600 mr-2"
                      aria-hidden="true"
                    ></span>
                    Unverified: Community reported, awaiting inspection
                  </li>
                  <li className="flex items-center text-red-800 dark:text-red-300">
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-red-600 mr-2"
                      aria-hidden="true"
                    ></span>
                    Unavailable: Out of service or obstructed
                  </li>
                </ul>
              </div>
            </div>

            <div className="rounded-lg border-2 border-[var(--border)] p-6 bg-[var(--background)] flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-3 text-[var(--foreground)]">
                  2. Confidence-Labeled Routes
                </h3>
                <p className="text-[var(--muted-foreground)] text-sm leading-relaxed mb-4">
                  Multi-floor route planning calculates paths tailored to mobility profiles. When a
                  user requests a step-free route, stairs are strictly omitted.
                </p>
                <p className="text-[var(--muted-foreground)] text-xs leading-relaxed">
                  Every path segment displays an explicit text confidence label (Confirmed or
                  Unverified). The interface never labels a route as accessible unless the server
                  certifies every segment as confirmed and step-free.
                </p>
              </div>
            </div>

            <div className="rounded-lg border-2 border-[var(--border)] p-6 bg-[var(--background)] flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-3 text-[var(--foreground)]">
                  3. Moderated Reporting
                </h3>
                <p className="text-[var(--muted-foreground)] text-sm leading-relaxed mb-4">
                  When a physical barrier arises—such as a broken lift or blocked corridor—users
                  submit reports with location details and direct evidence uploads.
                </p>
                <p className="text-[var(--muted-foreground)] text-xs leading-relaxed">
                  Reports progress through an append-only audit trail and human moderation. When
                  facility status changes, graph versions increment and routes recalculate
                  automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t-2 border-[var(--border)] bg-[var(--background)] px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-[var(--foreground)] mb-6">
            What PathPulse Does Not Do
          </h2>
          <p className="text-center text-[var(--muted-foreground)] mb-10 text-base max-w-2xl mx-auto">
            Transparency and safety require setting clear boundaries. PathPulse provides
            navigational assistance and facility tracking, not guarantees.
          </p>

          <div className="space-y-6">
            <div className="rounded-md border-l-4 border-amber-600 bg-[var(--card)] p-4">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
                Does Not Certify Compliance
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                PathPulse does not certify that any venue or building complies with local building
                codes, statutory accessibility standards, or the Rights of Persons with Disabilities
                (RPwD) Act 2016. Verification reflects reported operational status, not statutory
                engineering certification.
              </p>
            </div>

            <div className="rounded-md border-l-4 border-amber-600 bg-[var(--card)] p-4">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
                Does Not Guarantee Absolute Route Safety
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Physical environments change rapidly. An elevator may malfunction between updates,
                or a temporary delivery may block a ramp. PathPulse calculates routes using the
                latest reported graph version, but users must always assess on-the-ground
                conditions.
              </p>
            </div>

            <div className="rounded-md border-l-4 border-amber-600 bg-[var(--card)] p-4">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
                AI Never Decides or Certifies Anything
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                PathPulse uses an internal offline classifier (benchmarked at 91.7% accuracy across
                hand-labelled barrier reports) solely to suggest categories and detect duplicate
                submissions for human review. AI models never alter report status, approve
                resolutions, or certify facility states. Every operational decision is made by
                authorized human personnel.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/explore"
              className="inline-block rounded-md bg-[var(--primary)] px-6 py-3 font-semibold text-[var(--primary-foreground)] shadow hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
            >
              Start Exploring Campus Venues
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
