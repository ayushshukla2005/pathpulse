import Link from "next/link";
import { AlertCircle, ArrowLeft, Flag, PhoneCall } from "lucide-react";

interface NoConfirmedRouteStateProps {
  reason: string;
  venueContact?: {
    phone?: string;
    email?: string;
  } | null;
  onChooseDifferentProfile: () => void;
  className?: string;
}

export function NoConfirmedRouteState({
  reason,
  venueContact,
  onChooseDifferentProfile,
  className = "",
}: NoConfirmedRouteStateProps) {
  return (
    <section
      role="region"
      aria-labelledby="no-route-heading"
      className={`rounded-xl border border-amber-200 bg-amber-50/60 p-6 text-slate-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-slate-100 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <AlertCircle
          className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-500"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h2 id="no-route-heading" className="text-lg font-bold text-slate-900 dark:text-white">
            No Confirmed Route Available
          </h2>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {reason ||
              "A route meeting the selected accessibility standards could not be confirmed."}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-amber-200/80 pt-5 dark:border-amber-900/60">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          What you can do next:
        </h3>
        <ul className="mt-3 space-y-3">
          <li className="flex items-center gap-2">
            <button
              type="button"
              onClick={onChooseDifferentProfile}
              className="inline-flex min-h-[36px] items-center gap-2 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span>Choose a different mobility profile</span>
            </button>
          </li>

          <li className="flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <span className="inline-flex h-8 items-center gap-2 rounded-lg bg-white/70 px-3 py-1 ring-1 ring-slate-200 dark:bg-slate-900/70 dark:ring-slate-800">
              <PhoneCall className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span>
                {venueContact?.phone
                  ? `Contact venue: ${venueContact.phone}`
                  : venueContact?.email
                    ? `Contact venue: ${venueContact.email}`
                    : "Contact venue: Request on-site staff assistance at the main reception or info desk."}
              </span>
            </span>
          </li>

          <li className="flex items-center gap-2">
            <Link
              href="/reports/new"
              className="inline-flex min-h-[36px] items-center gap-2 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800 dark:hover:bg-slate-800"
            >
              <Flag className="h-4 w-4 text-amber-600 dark:text-amber-500" aria-hidden="true" />
              <span>Report an accessibility barrier</span>
            </Link>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              (Reporting form is built in Step 11)
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
