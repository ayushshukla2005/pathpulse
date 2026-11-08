import * as React from "react";
import { Suspense } from "react";
import { ReportForm } from "@/components/reports/report-form";

export const metadata = {
  title: "Report an Accessibility Barrier",
};

export default function NewReportPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="container mx-auto px-4 py-8 focus:outline-none"
    >
      <div className="max-w-2xl mx-auto mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Report an Accessibility Barrier
        </h1>
        <p className="mt-2 text-base text-[var(--muted-foreground)]">
          Help improve community accessibility by reporting broken lifts, blocked ramps, and
          inaccessible entrances.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="max-w-2xl mx-auto p-8 text-center text-[var(--muted-foreground)]">
            Loading report form...
          </div>
        }
      >
        <ReportForm />
      </Suspense>
    </main>
  );
}
