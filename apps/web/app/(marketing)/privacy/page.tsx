import type { Metadata } from "next";
import { GlassPanel } from "@/components/ui/glass";

export const metadata: Metadata = {
  title: "Privacy Notice — PathPulse Data Practices & DPDP 2023",
  description:
    "Review PathPulse's privacy notice, data inventory, retention schedules, and your rights under India's Digital Personal Data Protection Act, 2023.",
};

export default function PrivacyNoticePage() {
  return (
    <main id="main-content" className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-md border-2 border-amber-600 bg-amber-50 p-4 dark:bg-amber-950/40">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            [DRAFT FOR LEGAL REVIEW — This notice is a technical draft prepared for software
            development and does not constitute formal legal advice. It must be reviewed and
            approved by qualified legal counsel prior to formal commercial or public launch.]
          </p>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--foreground)] mb-6">
          Privacy Notice
        </h1>

        <div className="prose prose-slate max-w-none text-[var(--foreground)] space-y-6">
          <p className="text-sm text-[var(--muted-foreground)]">Last Updated: November 2026</p>

          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            This Privacy Notice explains how PathPulse collects, stores, processes, and protects
            personal data when you interact with our website, navigation platform, and reporting
            tools. PathPulse is designed with data minimization as a core principle: we do not track
            passive continuous location, and accessibility navigation preferences are treated as
            functional parameters rather than medical health records.
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            Legal Framework & Purpose
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            This notice is prepared pursuant to Section 5 of India's Digital Personal Data
            Protection Act, 2023 (DPDP Act, 2023, Act No. 22 of 2023, published in The Gazette of
            India on August 11, 2023 by the Ministry of Electronics and Information Technology,
            Government of India).
          </p>
          <GlassPanel className="p-4 my-4">
            <p className="text-sm font-mono text-[var(--foreground)]">
              [PLACEHOLDER: Legal Basis under DPDP Act 2023 — Explicit Consent under Section 6 and
              Specified Legitimate Uses under Section 7]
            </p>
          </GlassPanel>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            Complete Personal Data Inventory
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            The following table details every personal data element stored in the PathPulse
            database, its storage location, intended processing purpose, and retention schedule:
          </p>

          <div className="overflow-x-auto rounded-md border border-[var(--border)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--card)] border-b border-[var(--border)] text-[var(--foreground)]">
                <tr>
                  <th className="p-3 font-bold">Data Field</th>
                  <th className="p-3 font-bold">Storage Location</th>
                  <th className="p-3 font-bold">Processing Purpose</th>
                  <th className="p-3 font-bold">Retention Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--muted-foreground)]">
                <tr>
                  <td className="p-3 font-semibold text-[var(--foreground)]">Email Address</td>
                  <td className="p-3 font-mono">users table</td>
                  <td className="p-3">
                    Account identity, secure authentication, and password recovery.
                  </td>
                  <td className="p-3 font-mono">
                    [PLACEHOLDER: Account lifecycle + 30 days after deletion request]
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--foreground)]">Display Name</td>
                  <td className="p-3 font-mono">users table</td>
                  <td className="p-3">Interface personalization and report audit attribution.</td>
                  <td className="p-3 font-mono">[PLACEHOLDER: Account lifecycle]</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--foreground)]">Password Hash</td>
                  <td className="p-3 font-mono">users table (bcrypt hash)</td>
                  <td className="p-3">
                    Cryptographic verification of account login credentials. Plaintext passwords are
                    never stored or transmitted.
                  </td>
                  <td className="p-3 font-mono">[PLACEHOLDER: Account lifecycle]</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--foreground)]">
                    Mobility Preferences
                  </td>
                  <td className="p-3 font-mono">user_preferences table</td>
                  <td className="p-3">
                    Calculates personalized routes (e.g., step-free paths, maximum slope limits,
                    elevator avoidance). Never used for profiling.
                  </td>
                  <td className="p-3 font-mono">
                    [PLACEHOLDER: Until modified by user or account deletion]
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--foreground)]">
                    Barrier Report Descriptions
                  </td>
                  <td className="p-3 font-mono">issue_reports table</td>
                  <td className="p-3">
                    Documenting reported physical obstacles for institutional maintenance triage.
                  </td>
                  <td className="p-3 font-mono">
                    [PLACEHOLDER: Active report lifecycle + 1 year for accessibility audit logs]
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--foreground)]">
                    Location Coordinates
                  </td>
                  <td className="p-3 font-mono">venues / issue_reports geometry</td>
                  <td className="p-3">
                    Geographic placement of venues and reported barriers.{" "}
                    <strong>Important:</strong> Collected only when you voluntarily choose to use
                    device location or enter coordinates manually. We do not track continuous or
                    background GPS movement.
                  </td>
                  <td className="p-3 font-mono">
                    [PLACEHOLDER: Lifecycle of the associated venue or report record]
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--foreground)]">
                    IP & Rate Limiting Data
                  </td>
                  <td className="p-3 font-mono">In-memory / Redis cache</td>
                  <td className="p-3">
                    Prevents denial-of-service attacks, brute force authentication, and spam
                    submissions.
                  </td>
                  <td className="p-3 font-mono">
                    [PLACEHOLDER: Ephemeral TTL, 60 seconds to 1 hour]
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--foreground)]">
                    Notification Records
                  </td>
                  <td className="p-3 font-mono">notifications table</td>
                  <td className="p-3">
                    Delivering status updates regarding reports and facility changes to the user.
                  </td>
                  <td className="p-3 font-mono">
                    [PLACEHOLDER: 90 days after delivery or until marked read and cleared]
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--foreground)]">Feedback Messages</td>
                  <td className="p-3 font-mono">feedback table</td>
                  <td className="p-3">
                    Public suggestions, bug reports, and accessibility inquiries. Anonymous unless
                    user is signed in.
                  </td>
                  <td className="p-3 font-mono">
                    [PLACEHOLDER: 180 days from receipt for quality review]
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--foreground)]">
                    Audit Log Actor IDs
                  </td>
                  <td className="p-3 font-mono">audit_logs table</td>
                  <td className="p-3">
                    Immutable security log tracking who verified, assigned, or resolved reports to
                    prevent unauthorized modifications.
                  </td>
                  <td className="p-3 font-mono">
                    [PLACEHOLDER: 3 years for organizational compliance and audit trails]
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            Rights of the Data Principal Under DPDP Act 2023
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            As a Data Principal under India's Digital Personal Data Protection Act, 2023, you enjoy
            statutory rights regarding your personal data:
          </p>
          <ul className="list-disc pl-6 text-sm text-[var(--muted-foreground)] space-y-2">
            <li>
              <strong>Right to Access Information (Section 11):</strong> You have the right to
              request a summary of personal data being processed about you and the processing
              activities undertaken.
            </li>
            <li>
              <strong>Right to Correction and Erasure (Section 12):</strong> You may update, correct
              inaccurate data, or request the erasure of personal data that is no longer necessary
              for the purpose for which it was collected.
            </li>
            <li>
              <strong>Right of Grievance Redressal (Section 13):</strong> You have the right to
              accessible and time-bound resolution of grievances from our Data Protection Officer.
            </li>
            <li>
              <strong>Right to Nominate (Section 14):</strong> You have the right to nominate
              another individual who shall exercise your data principal rights in the event of death
              or incapacity.
            </li>
            <li>
              <strong>Right to Withdraw Consent (Section 6(4)):</strong> Where processing is based
              on consent, you may withdraw your consent at any time through your account profile
              settings with the ease with which it was given.
            </li>
          </ul>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4">
            Grievance Redressal & Supervisory Authority
          </h2>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            For inquiries, requests to exercise your data principal rights, or privacy-related
            complaints, please contact our designated Grievance Redressal Officer:
          </p>
          <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/40 p-4">
            <p className="text-sm font-mono text-[var(--foreground)]">
              [PLACEHOLDER: Data Protection Officer / Grievance Redressal Officer, PathPulse Team,
              dpo@pathpulse.org]
            </p>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mt-4">
            Under Section 13(3) of the DPDP Act 2023, if you do not receive a response from our
            Grievance Redressal Officer within the prescribed timeframe or remain dissatisfied with
            our resolution, you may submit a formal complaint to the{" "}
            <strong>Data Protection Board of India (DPBI)</strong> in the manner specified by
            central government rules.
          </p>

          <div className="mt-8 rounded-md border-2 border-amber-600 bg-amber-50 p-4 dark:bg-amber-950/40">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              [DRAFT FOR LEGAL REVIEW — This notice is a technical draft prepared for software
              development and does not constitute formal legal advice. Must be reviewed by qualified
              legal counsel.]
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
