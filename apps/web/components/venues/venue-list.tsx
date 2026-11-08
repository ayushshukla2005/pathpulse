import type { VenueListItem as VenueListItemType } from "@pathpulse/shared-types";
import { VenueListItem } from "./venue-list-item";
import { EmptyState } from "./empty-state";

interface VenueListProps {
  venues: VenueListItemType[];
  selectedVenueId?: string | null;
  onSelectVenue?: (id: string) => void;
  isLoading?: boolean;
  onResetFilters?: () => void;
}

export function VenueList({
  venues,
  selectedVenueId,
  onSelectVenue,
  isLoading = false,
  onResetFilters,
}: VenueListProps) {
  if (isLoading) {
    return (
      <div role="status" aria-label="Loading venues" className="space-y-3">
        <span className="sr-only">Loading venues...</span>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border-2 border-[var(--border)] bg-[var(--card)] p-4"
          >
            <div className="h-4 w-24 rounded bg-[var(--muted)] mb-2" />
            <div className="h-5 w-48 rounded bg-[var(--muted)] mb-2" />
            <div className="h-3 w-64 rounded bg-[var(--muted)] mb-3" />
            <div className="h-3 w-32 rounded bg-[var(--muted)]" />
          </div>
        ))}
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <EmptyState
        title="No venues within this radius"
        description="Try a larger radius or remove the step-free filter to find more venues."
        actionLabel={onResetFilters ? "Reset filters" : undefined}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <ul role="list" aria-label="Venues list" className="space-y-3">
      {venues.map((venue) => (
        <li key={venue.id}>
          <VenueListItem
            venue={venue}
            isSelected={selectedVenueId === venue.id}
            onSelect={onSelectVenue}
          />
        </li>
      ))}
    </ul>
  );
}
