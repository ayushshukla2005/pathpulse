import type { Metadata } from "next";
import Link from "next/link";
import { GlassCard, GlassPanel } from "@/components/ui/glass";

export const metadata: Metadata = {
  title: "About Us — PathPulse Mission & Principles",
  description:
    "Learn about the PathPulse project, our core verification principle, and our commitment to accessible indoor navigation.",
};

export default function AboutPage() {
  return (
    <main id="main-content" className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--foreground)] mb-6">
          About PathPulse
        </h1>

        <div className="prose prose-slate max-w-none text-[var(--foreground)] space-y-6">
          <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
            PathPulse was founded to address a critical gap in digital navigation: while outdoor
            roads and sidewalks are extensively mapped, the interiors of public venues—airports,
            university campuses, transit terminals, and hospitals—remain navigational black boxes
            for people with disabilities.
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            Our Core Purpose
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            Our purpose is to enable self-determined, barrier-aware movement through complex
            multi-floor environments. We believe that accessibility information is only valuable if
            it is dependable. Navigating toward an elevator only to find it out of service is not
            just an inconvenience—it can leave someone stranded or put their physical safety at
            risk.
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            The Non-Negotiable Verification Principle
          </h2>
          <GlassPanel className="p-6 my-4">
            <p className="text-base font-semibold text-[var(--foreground)] mb-2">
              Rule 1: Unknown accessibility data is never treated as accessible.
            </p>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              In conventional apps, lack of reported barriers is often assumed to mean a route is
              accessible. At PathPulse, we reject this premise. Every facility and route segment is
              explicitly classified as Confirmed, Unverified, or Unavailable. If data has not been
              confirmed by facility inspection, our system labels it unverified so users can make
              informed personal decisions.
            </p>
          </GlassPanel>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            The Project Team
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            PathPulse is engineered by researchers, developers, and accessibility advocates working
            in close collaboration with campus stakeholders.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 my-6">
            <GlassCard className="p-5">
              <h3 className="text-base font-bold text-[var(--foreground)]">Core Contributors</h3>
              <p className="text-xs text-[var(--primary)] font-semibold mt-1">
                Team names to be added
              </p>
              <p className="text-xs font-mono text-[var(--muted-foreground)] mt-3">
                [PLACEHOLDER: Team Core Contributors — To Be Finalized by Steering Committee]
              </p>
            </GlassCard>
            <GlassCard className="p-5">
              <h3 className="text-base font-bold text-[var(--foreground)]">Academic Advisors</h3>
              <p className="text-xs text-[var(--primary)] font-semibold mt-1">
                Team names to be added
              </p>
              <p className="text-xs font-mono text-[var(--muted-foreground)] mt-3">
                [PLACEHOLDER: Academic Advisors — To Be Finalized by Steering Committee]
              </p>
            </GlassCard>
            <GlassCard className="p-5">
              <h3 className="text-base font-bold text-[var(--foreground)]">
                Accessibility Advocates
              </h3>
              <p className="text-xs text-[var(--primary)] font-semibold mt-1">
                Team names to be added
              </p>
              <p className="text-xs font-mono text-[var(--muted-foreground)] mt-3">
                [PLACEHOLDER: Campus Stakeholders and Advocates — To Be Finalized by Steering
                Committee]
              </p>
            </GlassCard>
          </div>

          <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-wrap gap-4">
            <Link
              href="/accessibility"
              className="inline-flex items-center min-h-[24px] text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
            >
              Read Our Accessibility Statement &rarr;
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center min-h-[24px] text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
            >
              Get in Touch With Our Team &rarr;
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
