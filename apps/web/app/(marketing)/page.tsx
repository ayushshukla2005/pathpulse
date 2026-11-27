import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheck,
  Compass,
  Activity,
  AlertTriangle,
  ArrowRight,
  MapPin,
  CheckCircle2,
  HelpCircle,
  XCircle,
} from "lucide-react";
import { GlassCard, GlassPanel } from "@/components/ui/glass";

export const metadata: Metadata = {
  title: "PathPulse — Accessibility-Aware Indoor Navigation",
  description:
    "Discover verified facilities, plan multi-floor step-free routes with explicit confidence labels, and report physical barriers with human moderation.",
};

export default function MarketingPage() {
  return (
    <main id="main-content" className="flex-1">
      <section className="relative overflow-hidden px-4 py-20 text-center sm:py-32">
        <div
          aria-hidden="true"
          className="pulse-ambient pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-tr from-cyan-500/20 via-sky-500/15 to-indigo-500/20 blur-3xl"
        />

        <div className="mx-auto max-w-5xl">
          <GlassPanel className="p-8 sm:p-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-6">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
              <span>Accessibility-Aware Campus Navigation</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-[var(--foreground)] font-display">
              Indoor Navigation With{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                Real-World Verification
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-[var(--muted-foreground)] leading-relaxed">
              Navigating modern campuses and multi-floor buildings often breaks down when elevators
              fail, ramps are obstructed, or accessibility claims go unverified. PathPulse maps
              indoor and outdoor facilities with transparent verification levels, calculates
              step-free routes, and tracks maintenance in real time.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-8 py-3.5 text-base sm:text-lg font-bold text-[var(--primary-foreground)] shadow-lg hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] transition-transform active:scale-95"
              >
                <Compass className="h-5 w-5" aria-hidden="true" />
                <span>Explore Venues</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-8 py-3.5 text-base sm:text-lg font-bold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] transition-colors"
              >
                <span>Create Free Account</span>
              </Link>
            </div>
          </GlassPanel>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-300 mb-3">
              <span>Transparent Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] font-display tracking-tight">
              How PathPulse Works
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <GlassCard className="p-7 flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 mb-5">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--foreground)] font-display">
                  1. Verified Facilities
                </h3>
                <p className="text-[var(--muted-foreground)] text-sm leading-relaxed mb-6">
                  Every facility—including elevators, accessible entrances, restrooms, and
                  ramps—displays its operational state and verification level:
                </p>
                <ul className="space-y-3 text-xs font-semibold">
                  <li className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-green-300">
                    <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" aria-hidden="true" />
                    <span>Confirmed: Verified by facility managers</span>
                  </li>
                  <li className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-300">
                    <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
                    <span>Unverified: Community reported, awaiting inspection</span>
                  </li>
                  <li className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-300">
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" aria-hidden="true" />
                    <span>Unavailable: Out of service or obstructed</span>
                  </li>
                </ul>
              </div>
            </GlassCard>

            <GlassCard className="p-7 flex flex-col justify-between hover:border-sky-500/40 transition-colors">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 mb-5">
                  <Compass className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--foreground)] font-display">
                  2. Confidence-Labeled Routes
                </h3>
                <p className="text-[var(--muted-foreground)] text-sm leading-relaxed mb-4">
                  Multi-floor route planning calculates paths tailored to mobility profiles. When a
                  user requests a step-free route, stairs are strictly omitted.
                </p>
                <p className="text-[var(--muted-foreground)] text-xs leading-relaxed rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  Every path segment displays an explicit text confidence label (Confirmed or
                  Unverified). The interface never labels a route as accessible unless the server
                  certifies every segment as confirmed and step-free.
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-7 flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 mb-5">
                  <Activity className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--foreground)] font-display">
                  3. Moderated Reporting
                </h3>
                <p className="text-[var(--muted-foreground)] text-sm leading-relaxed mb-4">
                  When a physical barrier arises—such as a broken lift or blocked corridor—users
                  submit reports with location details and direct evidence uploads.
                </p>
                <p className="text-[var(--muted-foreground)] text-xs leading-relaxed rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                  Reports progress through an append-only audit trail and human moderation. When
                  facility status changes, graph versions increment and routes recalculate
                  automatically.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--background)] px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <GlassPanel className="p-8 sm:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-[var(--foreground)] font-display tracking-tight mb-4">
                What PathPulse Does Not Do
              </h2>
              <p className="text-[var(--muted-foreground)] text-base max-w-2xl mx-auto leading-relaxed">
                Transparency and safety require setting clear boundaries. PathPulse provides
                navigational assistance and facility tracking, not guarantees.
              </p>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border-l-4 border-amber-500 bg-[var(--card)] p-5 border border-[var(--border)] shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" aria-hidden="true" />
                  <h3 className="text-lg font-bold text-[var(--foreground)] font-display">
                    Does Not Certify Compliance
                  </h3>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  PathPulse does not certify that any venue or building complies with local building
                  codes, statutory accessibility standards, or the Rights of Persons with
                  Disabilities (RPwD) Act 2016. Verification reflects reported operational status,
                  not statutory engineering certification.
                </p>
              </div>

              <div className="rounded-xl border-l-4 border-amber-500 bg-[var(--card)] p-5 border border-[var(--border)] shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" aria-hidden="true" />
                  <h3 className="text-lg font-bold text-[var(--foreground)] font-display">
                    Does Not Guarantee Absolute Route Safety
                  </h3>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Physical environments change rapidly. An elevator may malfunction between updates,
                  or a temporary delivery may block a ramp. PathPulse calculates routes using the
                  latest reported graph version, but users must always assess on-the-ground
                  conditions.
                </p>
              </div>

              <div className="rounded-xl border-l-4 border-amber-500 bg-[var(--card)] p-5 border border-[var(--border)] shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" aria-hidden="true" />
                  <h3 className="text-lg font-bold text-[var(--foreground)] font-display">
                    AI Never Decides or Certifies Anything
                  </h3>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  PathPulse uses an internal offline classifier (benchmarked at 91.7% accuracy
                  across hand-labelled barrier reports) solely to suggest categories and detect
                  duplicate submissions for human review. AI models never alter report status,
                  approve resolutions, or certify facility states. Every operational decision is
                  made by authorized human personnel.
                </p>
              </div>
            </div>
          </GlassPanel>

          <div className="mt-16">
            <GlassCard className="p-8 sm:p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] mx-auto mb-4">
                <MapPin className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] font-display tracking-tight mb-4">
                Ready to Navigate Without Barriers?
              </h3>
              <p className="text-sm sm:text-base text-[var(--muted-foreground)] max-w-xl mx-auto mb-8 leading-relaxed">
                Explore verified campus facilities or join PathPulse to report physical barriers and
                assist in maintaining accessible routes.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-8 py-3.5 text-base font-bold text-[var(--primary-foreground)] shadow-lg hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] transition-transform active:scale-95"
                >
                  <Compass className="h-5 w-5" aria-hidden="true" />
                  <span>Explore Venues</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-8 py-3.5 text-base font-bold text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] transition-colors"
                >
                  <span>Register an Account</span>
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>
    </main>
  );
}
