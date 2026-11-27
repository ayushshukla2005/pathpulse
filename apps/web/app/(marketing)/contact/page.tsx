import type { Metadata } from "next";
import { ContactForm } from "./contact-form";
import { FaqAccordion } from "@/components/contact/faq-accordion";

export const metadata: Metadata = {
  title: "Contact & Feedback — PathPulse",
  description:
    "Send accessibility feedback, report software bugs, or submit inquiries directly to the PathPulse team.",
};

const FAQ_ITEMS = [
  {
    id: "compliance",
    question: "Does PathPulse certify venue or building accessibility?",
    answer:
      "No. PathPulse provides navigational assistance and operational facility tracking, not statutory accessibility certification or code compliance guarantees under the RPwD Act 2016.",
  },
  {
    id: "routing",
    question: "How are step-free routes calculated?",
    answer:
      "When a step-free navigation preference is selected, multi-floor paths strictly omit stairs. Segments display explicit confidence labels, and routes depend only on confirmed operational facilities.",
  },
  {
    id: "moderation",
    question: "How are physical barrier reports verified?",
    answer:
      "All barrier reports follow an append-only audit trail and require human verification by authorized staff. AI models assist solely with duplicate detection and triage suggestions.",
  },
  {
    id: "reporting",
    question: "What should I do if an elevator or ramp is out of service?",
    answer:
      "You can submit an immediate community barrier report with location details and evidence photos. Once verified by facility managers, route graphs recalculate automatically.",
  },
];

export default function ContactPage() {
  return (
    <main id="main-content" className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-12">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--foreground)] mb-4">
            Contact & Feedback
          </h1>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed mb-8">
            We actively seek feedback on indoor accessibility information, navigational accuracy,
            and interface usability. Your comments help us improve campus mapping and assist
            institutional facility managers in resolving physical barriers.
          </p>

          <ContactForm />
        </div>

        <section aria-labelledby="faq-heading" className="pt-8 border-t border-[var(--border)]">
          <h2
            id="faq-heading"
            className="text-2xl font-bold tracking-tight text-[var(--foreground)] mb-6"
          >
            Frequently Asked Questions
          </h2>
          <FaqAccordion items={FAQ_ITEMS} />
        </section>
      </div>
    </main>
  );
}
