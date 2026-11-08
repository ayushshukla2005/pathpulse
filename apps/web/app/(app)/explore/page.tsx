"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { getVenues } from "@/lib/api/venues";
import { FilterPanel } from "@/components/venues/filter-panel";
import { LocationPicker } from "@/components/venues/location-picker";
import { VenueList } from "@/components/venues/venue-list";
import { Button } from "@/components/ui/button";
import { computeVerificationSummary } from "@pathpulse/validation";
import { AlertCircle, Map, RefreshCw } from "lucide-react";

const VenueMap = dynamic(() => import("@/components/map/venue-map"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Loading interactive map"
      className="flex h-full min-h-[350px] w-full items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[var(--muted)]/40 p-4"
    >
      <span className="text-sm font-semibold text-[var(--muted-foreground)]">Loading map...</span>
    </div>
  ),
});

interface LocationCoords {
  lat: number;
  lng: number;
}

export default function ExplorePage() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [category, setCategory] = useState<string>("");
  const [radiusMeters, setRadiusMeters] = useState<number>(1000);
  const [stepFreeOnly, setStepFreeOnly] = useState<boolean>(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [isMapCollapsedMobile, setIsMapCollapsedMobile] = useState<boolean>(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");

  const {
    data: rawVenues = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["venues", location?.lat, location?.lng, radiusMeters, category],
    queryFn: () =>
      getVenues({
        lat: location?.lat,
        lng: location?.lng,
        radiusMeters,
        category: category || undefined,
      }),
  });

  const venues = useMemo(() => {
    if (!stepFreeOnly) return rawVenues;
    return rawVenues.filter((venue) => {
      const summary = computeVerificationSummary(venue.facilities);
      return summary.hasStepFreeEntrance;
    });
  }, [rawVenues, stepFreeOnly]);

  useEffect(() => {
    if (!isLoading && !isError) {
      setLiveAnnouncement(
        `${venues.length} ${venues.length === 1 ? "venue" : "venues"} available within ${
          radiusMeters >= 1000 ? `${radiusMeters / 1000} kilometers` : `${radiusMeters} meters`
        }`,
      );
    }
  }, [venues.length, isLoading, isError, radiusMeters]);

  const handleResetFilters = () => {
    setCategory("");
    setRadiusMeters(5000);
    setStepFreeOnly(false);
    setLiveAnnouncement("Filters reset. Radius expanded to 5 kilometers.");
  };

  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div id="explore-announcer" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Explore Accessible Venues
        </h1>
        <p className="mt-2 text-base text-[var(--muted-foreground)]">
          Discover verified accessible campuses, buildings, and facilities with verified step-free
          routes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-6">
          <LocationPicker
            location={location}
            onLocationChange={(coords) => {
              setLocation(coords);
            }}
            onAnnounce={(msg) => setLiveAnnouncement(msg)}
          />

          <FilterPanel
            category={category}
            onCategoryChange={(cat) => setCategory(cat)}
            radiusMeters={radiusMeters}
            onRadiusChange={(radius) => setRadiusMeters(radius)}
            stepFreeOnly={stepFreeOnly}
            onStepFreeOnlyChange={(checked) => setStepFreeOnly(checked)}
            totalResults={venues.length}
          />

          <div className="block lg:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMapCollapsedMobile((prev) => !prev)}
              aria-expanded={!isMapCollapsedMobile}
              aria-controls="mobile-map-panel"
              className="w-full flex items-center justify-center gap-2"
            >
              <Map className="h-4 w-4" aria-hidden="true" />
              <span>
                {isMapCollapsedMobile ? "Show supplementary map" : "Hide supplementary map"}
              </span>
            </Button>
            {!isMapCollapsedMobile && (
              <div id="mobile-map-panel" className="mt-4 h-[350px]">
                <VenueMap
                  venues={venues}
                  selectedVenueId={selectedVenueId}
                  onSelectVenue={(id) => setSelectedVenueId(id)}
                />
              </div>
            )}
          </div>

          <section aria-labelledby="venue-list-heading">
            <h2 id="venue-list-heading" className="sr-only">
              Venues List
            </h2>

            {isError ? (
              <div
                role="alert"
                className="rounded-lg border-2 border-red-600 bg-red-50 p-6 text-center text-red-900 dark:border-red-500 dark:bg-red-950 dark:text-red-100"
              >
                <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" aria-hidden="true" />
                <h3 className="text-base font-bold">Failed to load venues</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {error instanceof Error ? error.message : "An unexpected network error occurred."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => refetch()}
                  className="mt-4 inline-flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  <span>Retry search</span>
                </Button>
              </div>
            ) : (
              <VenueList
                venues={venues}
                selectedVenueId={selectedVenueId}
                onSelectVenue={(id) => setSelectedVenueId(id)}
                isLoading={isLoading}
                onResetFilters={handleResetFilters}
              />
            )}
          </section>
        </div>

        <div className="hidden lg:col-span-6 lg:block">
          <div className="sticky top-20 h-[calc(100vh-6rem)] min-h-[500px]">
            <VenueMap
              venues={venues}
              selectedVenueId={selectedVenueId}
              onSelectVenue={(id) => setSelectedVenueId(id)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
