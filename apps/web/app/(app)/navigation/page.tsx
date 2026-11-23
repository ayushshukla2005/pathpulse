"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FindRouteRequest, MobilityProfile, RoutePlanResult } from "@pathpulse/shared-types";
import { groupStepsByFloor, validateRouteRequest } from "@pathpulse/validation";
import { useAuth } from "@/lib/auth/auth-context";
import { getBuildingMap, postRoute } from "@/lib/api/routes";
import { GlassCard } from "@/components/ui/glass";
import { RouteSummary } from "@/components/navigation/route-summary";
import { StepList } from "@/components/navigation/step-list";
import { FloorSelector } from "@/components/navigation/floor-selector";
import { FloorPlanOverlay } from "@/components/navigation/floor-plan-overlay";
import { NoConfirmedRouteState } from "@/components/navigation/no-confirmed-route-state";
import { RouteStatusAnnouncer } from "@/components/navigation/route-status-announcer";
import { AlertCircle, ArrowRight, Loader2, Navigation, RefreshCw } from "lucide-react";

const PROFILE_OPTIONS: Array<{ value: MobilityProfile; label: string }> = [
  { value: "WHEELCHAIR", label: "Wheelchair (Step-free, elevators required, no stairs)" },
  { value: "LIMITED_MOBILITY", label: "Limited Mobility (Step-free preferred, lifts allowed)" },
  { value: "VISUALLY_IMPAIRED", label: "Visually Impaired (Tactile routes, stairs permitted)" },
  { value: "HEARING_IMPAIRED", label: "Hearing Impaired (Visual guidance prioritized)" },
  { value: "STROLLER", label: "Stroller / Pram (Step-free, ramps, elevators)" },
  { value: "CUSTOM", label: "Custom Preferences" },
];

function NavigationPlannerInner() {
  const searchParams = useSearchParams();
  const rawBuildingId = searchParams.get("buildingId") || "";
  const initialOrigin = searchParams.get("originNodeId") || "";
  const initialDestination = searchParams.get("destinationNodeId") || "";

  const { user } = useAuth();
  const defaultProfile: MobilityProfile = user?.preferences?.mobility_profile || "WHEELCHAIR";

  const [originNodeId, setOriginNodeId] = useState(initialOrigin);
  const [destinationNodeId, setDestinationNodeId] = useState(initialDestination);
  const [profile, setProfile] = useState<MobilityProfile>(defaultProfile);
  const [selectedFloorId, setSelectedFloorId] = useState<string>("ALL");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [announcerMessage, setAnnouncerMessage] = useState<string>("");
  const [profileChangedNotice, setProfileChangedNotice] = useState<boolean>(false);

  const {
    data: mapData,
    isLoading: isMapLoading,
    error: mapError,
  } = useQuery({
    queryKey: ["building-map", rawBuildingId],
    queryFn: () => getBuildingMap(rawBuildingId),
    enabled: rawBuildingId.trim().length > 0,
  });

  const routeMutation = useMutation<RoutePlanResult, Error, FindRouteRequest>({
    mutationFn: (req) => postRoute(req),
    onMutate: () => {
      setAnnouncerMessage("Calculating accessible route, please wait...");
      setProfileChangedNotice(false);
    },
    onSuccess: (data) => {
      if (data.status === "FOUND") {
        setAnnouncerMessage(
          `Route found. Total distance: ${Math.round(data.totalDistanceMeters)} metres, ${data.steps.length} steps.`,
        );
      } else {
        setAnnouncerMessage(`No confirmed route found. ${data.reason}`);
      }
    },
    onError: (err) => {
      setAnnouncerMessage(`Route calculation error: ${err.message}`);
    },
  });

  const floorMap = useMemo(() => {
    const map = new Map<string, { floorNumber: number; name: string }>();
    if (mapData?.floors) {
      for (const f of mapData.floors) {
        map.set(f.id, { floorNumber: f.floor_number, name: f.name });
      }
    }
    return map;
  }, [mapData?.floors]);

  const nodesMetaMap = useMemo(() => {
    const map = new Map<string, { floorId: string; floorNumber: number; floorName?: string }>();
    if (mapData?.nodes) {
      for (const n of mapData.nodes) {
        const f = floorMap.get(n.floor_id);
        map.set(n.id, {
          floorId: n.floor_id,
          floorNumber: f?.floorNumber ?? 0,
          floorName: f?.name ?? `Floor ${f?.floorNumber ?? 0}`,
        });
      }
    }
    return map;
  }, [mapData?.nodes, floorMap]);

  const sortedNodes = useMemo(() => {
    if (!mapData?.nodes) return [];
    return [...mapData.nodes].sort((a, b) => {
      const fa = floorMap.get(a.floor_id)?.floorNumber ?? 0;
      const fb = floorMap.get(b.floor_id)?.floorNumber ?? 0;
      if (fa !== fb) return fa - fb;
      return (a.name || a.node_type).localeCompare(b.name || b.node_type);
    });
  }, [mapData?.nodes, floorMap]);

  useEffect(() => {
    if (initialOrigin && !originNodeId) {
      setOriginNodeId(initialOrigin);
    }
    if (initialDestination && !destinationNodeId) {
      setDestinationNodeId(initialDestination);
    }
  }, [initialOrigin, initialDestination, originNodeId, destinationNodeId]);

  const handleProfileChange = (newProfile: MobilityProfile) => {
    setProfile(newProfile);
    if (routeMutation.data) {
      routeMutation.reset();
      setProfileChangedNotice(true);
      setAnnouncerMessage("Mobility profile changed. Please recalculate route.");
    }
  };

  const handleFloorSelect = (floorId: string) => {
    setSelectedFloorId(floorId);
    if (floorId === "ALL") {
      setAnnouncerMessage("Showing all floors.");
    } else {
      const fl = floorMap.get(floorId);
      setAnnouncerMessage(`Filtered to ${fl?.name || "selected floor"}.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileChangedNotice(false);

    const validation = validateRouteRequest({
      buildingId: rawBuildingId,
      originNodeId,
      destinationNodeId,
      profile,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      if (firstError) {
        setAnnouncerMessage(`Form error: ${firstError}`);
      }
      return;
    }

    setValidationErrors({});
    routeMutation.mutate({
      buildingId: rawBuildingId,
      originNodeId,
      destinationNodeId,
      profile,
    });
  };

  if (!rawBuildingId || rawBuildingId.trim().length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <GlassCard className="p-8 text-center">
          <Navigation className="mx-auto h-12 w-12 text-[var(--primary)]" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-[var(--foreground)]">
            Select a Building to Plan Route
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Please select a building from the Explore dashboard or Venue Details page to start
            navigation.
          </p>
          <div className="mt-6">
            <Link
              href="/explore"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <span>Go to Explore</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  if (isMapLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading building navigation map...
          </p>
        </div>
      </main>
    );
  }

  if (mapError || !mapData) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-slate-900 dark:border-red-900/50 dark:bg-red-950/20 dark:text-slate-100">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
            <div>
              <h1 className="text-base font-bold text-red-900 dark:text-red-200">
                Building Map Unavailable
              </h1>
              <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                {mapError instanceof Error
                  ? mapError.message
                  : "Could not load the building navigation network."}
              </p>
              <div className="mt-4">
                <Link
                  href="/explore"
                  className="inline-flex min-h-[36px] items-center gap-2 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
                >
                  <span>Return to Explore</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const result = routeMutation.data;
  const isFound = result?.status === "FOUND";
  const isNoConfirmedRoute =
    result?.status === "NO_CONFIRMED_ROUTE" ||
    result?.status === "UNREACHABLE" ||
    result?.status === "NOT_FOUND" ||
    result?.status === "BAD_REQUEST";

  const stepGroups = isFound ? groupStepsByFloor(result.steps, nodesMetaMap) : [];
  const unverifiedStepsCount = isFound
    ? result.steps.filter((s) => s.confidence === "UNVERIFIED").length
    : 0;

  const floorOptions = stepGroups.map((g) => ({
    floorId: g.floorId,
    floorNumber: g.floorNumber,
    floorName: g.floorName,
    stepCount: g.steps.length,
  }));

  const activeFloorName =
    selectedFloorId === "ALL" ? undefined : floorMap.get(selectedFloorId)?.name || "Selected Floor";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <RouteStatusAnnouncer message={announcerMessage} />

      <header className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Accessible Route Planner
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {mapData.building.name}
              {mapData.building.building_code ? ` (${mapData.building.building_code})` : ""}
            </p>
          </div>
          <Link
            href={`/buildings/${mapData.building.id}/floors`}
            className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            <span>View Floor Directory</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        aria-label="Route Planner Form"
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label
              htmlFor="origin-select"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              Origin Location
            </label>
            <select
              id="origin-select"
              value={originNodeId}
              onChange={(e) => {
                setOriginNodeId(e.target.value);
                if (validationErrors.originNodeId) {
                  setValidationErrors((prev) => ({ ...prev, originNodeId: "" }));
                }
              }}
              aria-invalid={!!validationErrors.originNodeId}
              aria-describedby={validationErrors.originNodeId ? "origin-error" : undefined}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select starting node...</option>
              {sortedNodes.map((n) => {
                const floorName = floorMap.get(n.floor_id)?.name || `Floor ${n.floor_id}`;
                return (
                  <option key={n.id} value={n.id}>
                    {n.name || n.node_type} ({floorName})
                  </option>
                );
              })}
            </select>
            {validationErrors.originNodeId && (
              <p
                id="origin-error"
                className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                {validationErrors.originNodeId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="destination-select"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              Destination Location
            </label>
            <select
              id="destination-select"
              value={destinationNodeId}
              onChange={(e) => {
                setDestinationNodeId(e.target.value);
                if (validationErrors.destinationNodeId) {
                  setValidationErrors((prev) => ({ ...prev, destinationNodeId: "" }));
                }
              }}
              aria-invalid={!!validationErrors.destinationNodeId}
              aria-describedby={
                validationErrors.destinationNodeId ? "destination-error" : undefined
              }
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select destination node...</option>
              {sortedNodes.map((n) => {
                const floorName = floorMap.get(n.floor_id)?.name || `Floor ${n.floor_id}`;
                return (
                  <option key={n.id} value={n.id}>
                    {n.name || n.node_type} ({floorName})
                  </option>
                );
              })}
            </select>
            {validationErrors.destinationNodeId && (
              <p
                id="destination-error"
                className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                {validationErrors.destinationNodeId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="profile-select"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              Mobility Profile
            </label>
            <select
              id="profile-select"
              value={profile}
              onChange={(e) => handleProfileChange(e.target.value as MobilityProfile)}
              aria-invalid={!!validationErrors.profile}
              aria-describedby={validationErrors.profile ? "profile-error" : undefined}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {PROFILE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {validationErrors.profile && (
              <p
                id="profile-error"
                className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                {validationErrors.profile}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Routes exclude confirmed out-of-service elevators and avoid unverified segments for
            step-free profiles.
          </p>

          <button
            type="submit"
            disabled={routeMutation.isPending}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {routeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Finding Route...</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" aria-hidden="true" />
                <span>Calculate Route</span>
              </>
            )}
          </button>
        </div>
      </form>

      {profileChangedNotice && (
        <aside
          role="note"
          aria-label="Profile changed notice"
          className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50/70 p-4 text-xs font-medium text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-200"
        >
          <div className="flex items-center gap-2">
            <RefreshCw
              className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400"
              aria-hidden="true"
            />
            <span>
              Mobility profile was changed. Click &quot;Calculate Route&quot; to request an updated
              path.
            </span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded bg-indigo-600 px-3 py-1 font-semibold text-white hover:bg-indigo-500"
          >
            Recalculate
          </button>
        </aside>
      )}

      {routeMutation.isPending && (
        <div
          role="status"
          className="mt-8 flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Evaluating multi-floor accessible path...
          </p>
        </div>
      )}

      {isNoConfirmedRoute && (
        <div className="mt-8">
          <NoConfirmedRouteState
            reason={result.reason}
            onChooseDifferentProfile={() => {
              const el = document.getElementById("profile-select");
              el?.focus();
            }}
          />
        </div>
      )}

      {isFound && (
        <div className="mt-8 space-y-6">
          <RouteSummary
            totalDistanceMeters={result.totalDistanceMeters}
            accessibility={result.accessibility}
            unverifiedCount={unverifiedStepsCount}
          />

          {result.warnings && result.warnings.length > 0 && (
            <aside
              role="alert"
              aria-labelledby="route-warnings-title"
              className="rounded-xl border border-amber-300 bg-amber-50/80 p-5 dark:border-amber-900/60 dark:bg-amber-950/20"
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500"
                  aria-hidden="true"
                />
                <div>
                  <h3
                    id="route-warnings-title"
                    className="text-sm font-bold text-amber-900 dark:text-amber-200"
                  >
                    Route Warnings & Advisories
                  </h3>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-amber-800 dark:text-amber-300">
                    {result.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Navigation Instructions
            </h2>
            <FloorSelector
              floors={floorOptions}
              selectedFloorId={selectedFloorId}
              onSelectFloor={handleFloorSelect}
            />
          </div>

          <FloorPlanOverlay
            nodes={mapData.nodes}
            routeSegments={result.steps}
            activeFloorId={selectedFloorId}
            floorName={activeFloorName}
          />

          <StepList groups={stepGroups} selectedFloorId={selectedFloorId} />
        </div>
      )}
    </main>
  );
}

export default function NavigationPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Loading navigation planner...
            </p>
          </div>
        </main>
      }
    >
      <NavigationPlannerInner />
    </Suspense>
  );
}
