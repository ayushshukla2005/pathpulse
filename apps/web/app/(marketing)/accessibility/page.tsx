import type { Metadata } from "next";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass";

export const metadata: Metadata = {
  title: "Accessibility Statement — PathPulse Standards & Conformance",
  description:
    "Review PathPulse's accessibility conformance status under WCAG 2.2 Level AA, known technical limitations, and grievance mechanisms.",
};

export default function AccessibilityStatementPage() {
  return (
    <main id="main-content" className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--foreground)] mb-6">
          Accessibility Statement
        </h1>

        <div className="prose prose-slate max-w-none text-[var(--foreground)] space-y-6">
          <p className="text-sm text-[var(--muted-foreground)]">
            Date of last review: November 2026
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            Our Commitment
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            PathPulse is committed to digital inclusion and barrier-free access for all individuals,
            including persons with physical, sensory, cognitive, and age-related access needs. As a
            navigation service focused specifically on physical accessibility, we treat digital
            accessibility as foundational to every interface, workflow, and data structure we
            develop.
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            Conformance Status
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and
            developers to improve accessibility for people with disabilities. It defines three
            levels of conformance: Level A, Level AA, and Level AAA.
          </p>
          <GlassPanel className="p-5 my-4">
            <p className="text-base font-semibold text-[var(--foreground)] mb-2">
              Status: Partially Conformant with WCAG 2.2 Level AA
            </p>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Based on comprehensive automated accessibility audits using axe-core and manual
              keyboard-only verification, PathPulse is partially conformant with WCAG 2.2 Level AA.
              Partially conformant means that while core workflows (authentication, venue discovery,
              route planning, barrier reporting, and moderation) adhere to Level AA requirements
              without critical or serious blockers, specific interactive components have documented
              limitations outlined below.
            </p>
          </GlassPanel>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            Known Technical Limitations
          </h2>
          <div className="space-y-4">
            <div className="rounded-md border border-[var(--border)] p-4 bg-[var(--background)]">
              <h3 className="text-base font-bold text-[var(--foreground)] mb-1">
                1. Map Visualization is Supplementary to Keyboard List
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                While our MapLibre WebGL canvas displays venue locations and indoor floor plan
                overlays, visual canvas elements cannot provide full screen reader parity. To ensure
                universal access, the keyboard-navigable list view is the primary discovery
                mechanism. Every venue, facility, and floor segment rendered on the map is fully
                operable and accessible via the accompanying list.
              </p>
            </div>

            <div className="rounded-md border border-[var(--border)] p-4 bg-[var(--background)]">
              <h3 className="text-base font-bold text-[var(--foreground)] mb-1">
                2. Image Analysis Deferral
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                In accordance with Step 14 safety requirements, PathPulse does not perform automated
                artificial intelligence analysis on uploaded barrier photographs. Evidence
                photographs are retained solely for human moderation and inspection. Users who are
                unable to inspect visual evidence may rely on written barrier descriptions provided
                by reporters and verified by moderators.
              </p>
            </div>

            <div className="rounded-md border border-[var(--border)] p-4 bg-[var(--background)]">
              <h3 className="text-base font-bold text-[var(--foreground)] mb-1">
                3. Interactive Floor Plan Keyboard Navigation Remediation
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-2">
                Indoor path geometries are currently communicated floor-by-floor using step-by-step
                instruction lists and SVG overlays. Future updates will introduce directional audio
                cues and enhanced screen-reader node exploration.
              </p>
              <p className="text-xs font-mono text-[var(--foreground)] bg-[var(--muted)]/50 p-2 rounded">
                [PLACEHOLDER: Complete Phase 2 Interactive Map SVG Remediation by Q2 2027 — Subject
                to Engineering Sprint Planning]
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            National Context & Guidelines
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            In designing PathPulse, our engineering team has consulted the official accessibility
            guidance published by the Department of Empowerment of Persons with Disabilities
            (DEPwD), Ministry of Social Justice and Empowerment, Government of India (available at{" "}
            <a
              href="https://depwd.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] underline"
            >
              depwd.gov.in
            </a>
            ), including the objectives of the Accessible India Campaign (Sugamya Bharat Abhiyan)
            and Sections 40 to 46 of the Rights of Persons with Disabilities (RPwD) Act, 2016
            regarding barrier-free built environments and accessible information systems. This
            consultation is referenced strictly as engineering context and does not constitute a
            formal claim of government certification or statutory audit compliance.
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            Feedback and Contact
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            We welcome your feedback on the accessibility of PathPulse. If you encounter
            accessibility barriers, experience difficulty accessing any part of our website, or
            require information in an alternative format, please contact us:
          </p>
          <ul className="list-disc pl-6 text-sm text-[var(--muted-foreground)] space-y-2">
            <li>
              Submit a direct message via our{" "}
              <Link href="/contact" className="text-[var(--primary)] underline font-semibold">
                Contact & Feedback Form
              </Link>
            </li>
            <li>
              Email our accessibility coordinator:{" "}
              <span className="font-mono text-[var(--foreground)]">
                [PLACEHOLDER: accessibility@pathpulse.org]
              </span>
            </li>
          </ul>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            Formal Grievance Procedure
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            If you are dissatisfied with our response to an accessibility grievance, you may
            escalate your concern through the designated statutory authority:
          </p>
          <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/40 p-4">
            <p className="text-sm font-mono text-[var(--foreground)]">
              [PLACEHOLDER: Enforcement Procedure under Section 43 of the Rights of Persons with
              Disabilities Act, 2016 — Office of the Chief Commissioner for Persons with
              Disabilities (CCPD)]
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
