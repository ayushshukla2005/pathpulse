"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getBuildingFloors, getBuildingMap } from "@/lib/api/routes";
import { GlassCard } from "@/components/ui/glass";
import { AlertCircle, ArrowLeft, Building2, Layers, Navigation, RefreshCw } from "lucide-react";

interface BuildingFloorsPageProps {
  params: Promise<{ id: string }>;
}

export default function BuildingFloorsPage({ params }: BuildingFloorsPageProps) {
  const { id: buildingId } = use(params);

  const {
    data: mapData,
    isLoading: isMapLoading,
    isError: isMapError,
    error: mapError,
    refetch,
  } = useQuery({
    queryKey: ["building-map", buildingId],
    queryFn: () => getBuildingMap(buildingId),
  });

  const { data: floorsData } = useQuery({
    queryKey: ["building-floors", buildingId],
    queryFn: () => getBuildingFloors(buildingId),
    enabled: !!buildingId,
  });

  useEffect(() => {
    if (mapData?.building?.name) {
      document.title = `${mapData.building.name} Floors | PathPulse`;
    }
  }, [mapData?.building?.name]);

  if (isMapLoading) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div role="status" aria-label="Loading building floors" className="animate-pulse space-y-6">
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
      </main>
    );
  }

  if (isMapError || !mapData) {
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
              <h1 className="text-base font-semibold">Unable to load building floors</h1>
              <p className="text-sm">
                {mapError instanceof Error ? mapError.message : "The building could not be found."}
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
                  href="/explore"
                  className="inline-flex min-h-[36px] items-center gap-2 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Back to Explore</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { building } = mapData;
  const floors = floorsData || mapData.floors;

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <GlassCard className="p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <span>Building Directory</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {building.name}
            </h1>
            {building.building_code && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Code: {building.building_code}
              </p>
            )}
          </div>

          <Link
            href={`/navigation?buildingId=${building.id}`}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            <span>Open Route Planner</span>
          </Link>
        </div>
      </GlassCard>

      <section aria-labelledby="floors-list-heading" className="mt-8">
        <GlassCard className="p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2
              id="floors-list-heading"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Available Floors
            </h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {floors.length} {floors.length === 1 ? "floor" : "floors"}
            </span>
          </div>

          {floors.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              No floors configured for this building.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {floors.map((floor) => {
                const nodeCount = mapData.nodes.filter((n) => n.floor_id === floor.id).length;
                return (
                  <li
                    key={floor.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {floor.floor_number}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {floor.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Level Index: {floor.level_index} • {nodeCount} mapped nodes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/buildings/${building.id}/floors/${floor.id}`}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Layers className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                        <span>View Floor Details</span>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </section>
    </main>
  );
}
