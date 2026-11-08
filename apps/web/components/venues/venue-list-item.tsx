import Link from "next/link";
import type { VenueListItem as VenueListItemType } from "@pathpulse/shared-types";
import { VerificationSummary } from "./verification-summary";
import { ChevronRight, MapPin, Navigation } from "lucide-react";

interface VenueListItemProps {
  venue: VenueListItemType;
  isSelected?: boolean;
  onSelect?: (venueId: string) => void;
}

function formatDistance(distanceMeters?: number): string | null {
  if (distanceMeters === undefined || distanceMeters === null) {
    return null;
  }
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km away`;
  }
  return `${distanceMeters} m away`;
}

export function VenueListItem({ venue, isSelected = false, onSelect }: VenueListItemProps) {
  const distanceText = formatDistance(venue.distanceMeters);

  return (
    <article
      id={`venue-card-${venue.id}`}
      aria-labelledby={`venue-title-${venue.id}`}
      className={`rounded-lg border-2 p-4 transition-colors ${
        isSelected
          ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-md"
          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              {venue.category}
            </span>
            {distanceText && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">
                <Navigation className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>{distanceText}</span>
              </span>
            )}
          </div>

          <h3 id={`venue-title-${venue.id}`} className="mt-2">
            <Link
              href={`/venues/${venue.id}`}
              className="inline-block text-lg font-bold text-[var(--foreground)] hover:text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded py-1 min-h-[32px]"
            >
              {venue.name}
            </Link>
          </h3>

          {venue.address && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-1">
              {venue.address}
            </p>
          )}

          <div className="mt-3">
            <VerificationSummary facilities={venue.facilities} />
          </div>

          <div className="mt-3 pt-2 border-t border-[var(--border)]/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onSelect?.(venue.id)}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] min-h-[28px]"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{isSelected ? "Selected on map" : "Show on map"}</span>
            </button>
          </div>
        </div>

        <Link
          href={`/venues/${venue.id}`}
          aria-label={`View details for ${venue.name}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
