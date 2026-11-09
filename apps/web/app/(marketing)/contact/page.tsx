import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact & Feedback — PathPulse",
  description:
    "Send accessibility feedback, report software bugs, or submit inquiries directly to the PathPulse team.",
};

export default function ContactPage() {
  return (
    <main id="main-content" className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--foreground)] mb-4">
          Contact & Feedback
        </h1>
        <p className="text-base text-[var(--muted-foreground)] leading-relaxed mb-8">
          We actively seek feedback on indoor accessibility information, navigational accuracy, and
          interface usability. Your comments help us improve campus mapping and assist institutional
          facility managers in resolving physical barriers.
        </p>

        <ContactForm />
      </div>
    </main>
  );
}
