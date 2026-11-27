"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getFloorDetails } from "@/lib/api/routes";
import { FacilityGroup } from "@/components/venues/facility-group";
import { GlassCard } from "@/components/ui/glass";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  HelpCircle,
  Layers,
  MapPin,
  Navigation,
  RefreshCw,
  XCircle,
} from "lucide-react";

interface FloorPageProps {
  params: Promise<{ id: string; floorId: string }>;
}

export default function FloorDetailPage({ params }: FloorPageProps) {
  const { id: buildingId, floorId } = use(params);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["floor-details", buildingId, floorId],
    queryFn: () => getFloorDetails(buildingId, floorId),
  });

  useEffect(() => {
    if (data?.floor?.name && data?.building?.name) {
      document.title = `${data.floor.name} — ${data.building.name} | PathPulse`;
    }
  }, [data?.floor?.name, data?.building?.name]);

  if (isLoading) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div role="status" aria-label="Loading floor details" className="animate-pulse space-y-6">
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
            <div className="space-y-2">
              <h1 className="text-base font-semibold">Unable to load floor details</h1>
              <p className="text-sm">
                {error instanceof Error
                  ? error.message
                  : "The requested floor could not be loaded."}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex min-h-[36px] items-center gap-2 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  <span>Try again</span>
                </button>
                <Link
                  href={`/buildings/${buildingId}/floors`}
                  className="inline-flex min-h-[36px] items-center gap-2 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Back to Floors</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { floor, building, nodes, facilities } = data;

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumbs" className="mb-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link
            href={`/buildings/${building.id}/floors`}
            className="hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            {building.name} Floors
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-900 dark:text-white" aria-current="page">
            {floor.name}
          </span>
        </div>
      </nav>

      <GlassCard className="p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Layers className="h-4 w-4" aria-hidden="true" />
              <span>Floor Level {floor.floor_number}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {floor.name}
            </h1>
            <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Building2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span>
                {building.name} {building.building_code ? `(${building.building_code})` : ""}
              </span>
            </p>
          </div>

          <Link
            href={`/navigation?buildingId=${building.id}`}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            <span>Plan Route Here</span>
          </Link>
        </div>
      </GlassCard>

      <section aria-labelledby="floor-nodes-heading" className="mt-8">
        <GlassCard className="p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2
              id="floor-nodes-heading"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Navigation Nodes on this Floor
            </h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {nodes.length} {nodes.length === 1 ? "node" : "nodes"}
            </span>
          </div>

          {nodes.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              No navigation nodes mapped on this floor yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {nodes.map((node) => (
                <li
                  key={node.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin
                      className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {node.name || node.node_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Kind: {node.node_type}
                    </span>
                    <Link
                      href={`/navigation?buildingId=${building.id}&originNodeId=${node.id}`}
                      className="inline-flex min-h-[32px] items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                    >
                      <span>Route from here</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </section>

      <section aria-labelledby="floor-facilities-heading" className="mt-8">
        <GlassCard className="p-6 shadow-sm">
          <h2
            id="floor-facilities-heading"
            className="text-lg font-bold text-slate-900 dark:text-white"
          >
            Facilities on this Floor
          </h2>

          {facilities.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              No specific accessibility facilities logged for this floor level.
            </p>
          ) : (
            <div className="mt-4">
              <FacilityGroup facilities={facilities} />
            </div>
          )}
        </GlassCard>
      </section>

      <section aria-labelledby="verification-legend-heading" className="mt-8">
        <GlassCard className="p-5">
          <h2
            id="verification-legend-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            Verification Standards
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-500"
                aria-hidden="true"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Confirmed</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Verified on-site by accredited reviewers or organizations.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <HelpCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500"
                aria-hidden="true"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Unverified</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Self-reported or awaiting physical audit. Never treated as confirmed.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <XCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-500"
                aria-hidden="true"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Unavailable</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Out of service or non-operational. Never used for routes.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>
    </main>
  );
}
