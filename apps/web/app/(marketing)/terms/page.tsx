import type { Metadata } from "next";
import { GlassPanel } from "@/components/ui/glass";

export const metadata: Metadata = {
  title: "Terms of Use — PathPulse User Agreement & Policies",
  description:
    "Review PathPulse's terms of use, community conduct rules for barrier reporting, moderation procedures, and liability disclaimers.",
};

export default function TermsOfUsePage() {
  return (
    <main id="main-content" className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-md border-2 border-amber-600 bg-amber-50 p-4 dark:bg-amber-950/40">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            [DRAFT FOR LEGAL REVIEW — This agreement is a technical draft prepared for software
            development and does not constitute formal legal advice. It must be reviewed and
            approved by qualified legal counsel prior to formal launch.]
          </p>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--foreground)] mb-6">
          Terms of Use
        </h1>

        <div className="prose prose-slate max-w-none text-[var(--foreground)] space-y-6">
          <p className="text-sm text-[var(--muted-foreground)]">Effective Date: November 2026</p>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            1. Nature of the Service
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            PathPulse is an assistive digital navigation platform designed to provide accessibility
            information, indoor multi-floor routing calculations, and barrier reporting tools for
            participating public and institutional facilities. PathPulse is provided as an
            informational navigational aid.
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            2. The Verification Principle & User Reliance
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            Physical environments change dynamically. Elevators may suffer sudden mechanical
            breakdowns, doors may be locked for maintenance, and temporary obstacles (such as
            delivery pallets or cleaning carts) may obstruct corridors without warning.
          </p>
          <GlassPanel className="p-5 my-4">
            <p className="text-base font-semibold text-[var(--foreground)] mb-2">
              No Absolute Guarantee of Accessibility or Safety
            </p>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Users must not rely on PathPulse data as an absolute guarantee that a route or
              facility is physically unobstructed or completely safe. Route options labeled as
              "Confirmed" reflect the most recent verified inspection, while items labeled
              "Unverified" reflect user submissions that have not yet been corroborated by facility
              staff. Users must exercise personal judgment and assess physical surroundings when
              navigating.
            </p>
          </GlassPanel>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            3. User Conduct & Community Reporting Rules
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            PathPulse allows registered users to submit barrier reports and upload photographic
            evidence. When using the community reporting tools, you agree to the following rules:
          </p>
          <ul className="list-disc pl-6 text-sm text-[var(--muted-foreground)] space-y-2">
            <li>
              <strong>No False or Fictitious Reports:</strong> You shall only submit reports
              regarding genuine, observed physical accessibility barriers. Submitting fictitious,
              misleading, or abusive reports is strictly prohibited.
            </li>
            <li>
              <strong>No Personal Data of Others in Evidence:</strong> When capturing and uploading
              evidence photographs, you must ensure that images do not contain identifiable faces of
              bystanders, vehicle registration numbers, or confidential personal information.
            </li>
            <li>
              <strong>No Malicious Payloads:</strong> You must not attempt to upload malicious
              software, scripts, or corrupted media to our storage infrastructure.
            </li>
          </ul>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            4. Content Moderation & Verification Workflow
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            All submitted reports enter a formal moderation lifecycle. PathPulse authorized
            moderators and organization administrators reserve the absolute right to verify, assign,
            reject, or close reports in accordance with verification criteria. Users may not verify,
            assign, or approve resolutions for their own submitted reports. Artificial intelligence
            suggestions are advisory only and never determine moderation outcomes.
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            5. Account Suspension and Termination
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            We reserve the right to suspend or terminate accounts that repeatedly violate reporting
            standards, submit fraudulent barrier reports, engage in abusive conduct toward
            moderators, or attempt to circumvent security controls.
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            6. Limitation of Liability
          </h2>
          <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/40 p-4">
            <p className="text-sm font-mono text-[var(--foreground)]">
              [PLACEHOLDER: Standard Limitation of Liability and Disclaimer of Warranties — Subject
              to Final Legal Review]
            </p>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            7. Governing Law & Dispute Resolution
          </h2>
          <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/40 p-4">
            <p className="text-sm font-mono text-[var(--foreground)]">
              [PLACEHOLDER: Jurisdiction of Courts in New Delhi, India — Subject to Final Legal
              Review]
            </p>
          </div>

          <div className="mt-8 rounded-md border-2 border-amber-600 bg-amber-50 p-4 dark:bg-amber-950/40">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              [DRAFT FOR LEGAL REVIEW — Technical draft prepared for development. Must be reviewed
              by qualified legal counsel.]
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
