"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getVenueById } from "@/lib/api/venues";
import { formatSourceText } from "@/lib/utils";
import { FacilityGroup } from "@/components/venues/facility-group";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  HelpCircle,
  MapPin,
  RefreshCw,
  XCircle,
} from "lucide-react";

interface VenuePageProps {
  params: Promise<{ id: string }>;
}

export default function VenueDetailPage({ params }: VenuePageProps) {
  const { id } = use(params);

  const {
    data: venue,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["venue", id],
    queryFn: () => getVenueById(id),
  });

  useEffect(() => {
    if (venue?.name) {
      document.title = `${venue.name} — Venue Details | PathPulse`;
    }
  }, [venue?.name]);

  if (isLoading) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div role="status" aria-label="Loading venue details" className="animate-pulse space-y-6">
          <div className="h-4 w-28 rounded bg-[var(--muted)]" />
          <div className="h-32 rounded-lg bg-[var(--muted)]" />
          <div className="h-28 rounded-lg bg-[var(--muted)]" />
          <div className="h-64 rounded-lg bg-[var(--muted)]" />
          <span className="sr-only">Loading venue details...</span>
        </div>
      </main>
    );
  }

  if (isError || !venue) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded px-1 py-0.5"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Explore</span>
          </Link>
        </div>

        <div
          role="alert"
          className="rounded-lg border-2 border-red-600 bg-red-50 p-8 text-center text-red-900 dark:border-red-500 dark:bg-red-950 dark:text-red-100"
        >
          <AlertCircle className="mx-auto h-10 w-10 text-red-600 mb-3" aria-hidden="true" />
          <h1 className="text-xl font-bold">Venue not found</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {error instanceof Error ? error.message : "The requested venue could not be retrieved."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            className="mt-6 inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Retry</span>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded px-1 py-0.5"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Explore</span>
        </Link>
      </div>

      <header className="mb-8 rounded-lg border-2 border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            {venue.category}
          </span>
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            {formatSourceText(venue.source, venue.updated_at)}
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-extrabold text-[var(--foreground)] sm:text-4xl">
          {venue.name}
        </h1>

        {venue.address && (
          <p className="mt-2 flex items-center gap-1.5 text-base text-[var(--muted-foreground)]">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden="true" />
            <span>{venue.address}</span>
          </p>
        )}
      </header>

      <section
        aria-labelledby="legend-heading"
        className="mb-8 rounded-lg border-2 border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
      >
        <h2 id="legend-heading" className="text-base font-bold text-[var(--foreground)]">
          Facility Verification Legend
        </h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          PathPulse explicitly verifies facility accessibility so that you can navigate with
          confidence.
        </p>

        <ul role="list" className="mt-4 grid gap-3 sm:grid-cols-3">
          <li className="flex items-start gap-2.5 rounded-md border border-emerald-700 bg-emerald-50/60 p-3 text-xs dark:border-emerald-500 dark:bg-emerald-950/30">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <strong className="block font-bold text-emerald-900 dark:text-emerald-200">
                Confirmed
              </strong>
              <span className="text-emerald-800 dark:text-emerald-300">
                Physically inspected by organization staff or approved moderators and confirmed
                operational.
              </span>
            </div>
          </li>

          <li className="flex items-start gap-2.5 rounded-md border border-amber-700 bg-amber-50/60 p-3 text-xs dark:border-amber-500 dark:bg-amber-950/30">
            <HelpCircle
              className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <strong className="block font-bold text-amber-900 dark:text-amber-200">
                Unverified
              </strong>
              <span className="text-amber-800 dark:text-amber-300">
                Reported or imported data that has not yet undergone official verification. Never
                treated as guaranteed.
              </span>
            </div>
          </li>

          <li className="flex items-start gap-2.5 rounded-md border border-red-700 bg-red-50/60 p-3 text-xs dark:border-red-500 dark:bg-red-950/30">
            <XCircle
              className="h-4 w-4 shrink-0 text-red-700 dark:text-red-400 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <strong className="block font-bold text-red-900 dark:text-red-200">
                Unavailable
              </strong>
              <span className="text-red-800 dark:text-red-300">
                Facility is out of service, undergoing maintenance, or physically blocked.
              </span>
            </div>
          </li>
        </ul>
      </section>

      {venue.buildings && venue.buildings.length > 0 && (
        <section
          aria-labelledby="buildings-heading"
          className="mb-8 rounded-lg border-2 border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 border-b-2 border-[var(--border)] pb-3 mb-4">
            <Building2 className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
            <h2 id="buildings-heading" className="text-lg font-bold text-[var(--foreground)]">
              Buildings ({venue.buildings.length})
            </h2>
          </div>

          <ul role="list" className="grid gap-3 sm:grid-cols-2">
            {venue.buildings.map((building) => (
              <li
                key={building.id}
                className="flex items-center justify-between rounded-md border-2 border-[var(--border)] bg-[var(--background)] p-3"
              >
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">{building.name}</h3>
                  {building.building_code && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Code: {building.building_code}
                    </span>
                  )}
                </div>
                <Link
                  href={`/buildings/${building.id}/floors`}
                  className="rounded-md border border-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  View Floors
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="facilities-heading" className="space-y-4">
        <h2 id="facilities-heading" className="text-2xl font-bold text-[var(--foreground)]">
          Accessibility Facilities
        </h2>
        <FacilityGroup facilities={venue.facilities} />
      </section>
    </main>
  );
}
