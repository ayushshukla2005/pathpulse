import { RADIUS_OPTIONS } from "@pathpulse/validation";
import { Filter } from "lucide-react";

interface FilterPanelProps {
  category: string;
  onCategoryChange: (category: string) => void;
  radiusMeters: number;
  onRadiusChange: (radiusMeters: number) => void;
  stepFreeOnly: boolean;
  onStepFreeOnlyChange: (enabled: boolean) => void;
  categories?: string[];
  totalResults?: number;
}

const DEFAULT_CATEGORIES = [
  "CAMPUS",
  "HOSPITAL",
  "TRANSIT",
  "SHOPPING",
  "OFFICE",
  "CULTURAL",
  "OTHER",
];

export function FilterPanel({
  category,
  onCategoryChange,
  radiusMeters,
  onRadiusChange,
  stepFreeOnly,
  onStepFreeOnlyChange,
  categories = DEFAULT_CATEGORIES,
  totalResults,
}: FilterPanelProps) {
  return (
    <section
      aria-labelledby="filter-panel-heading"
      className="rounded-lg border-2 border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between border-b-2 border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
          <h2 id="filter-panel-heading" className="text-base font-bold text-[var(--foreground)]">
            Filters & Accessibility
          </h2>
        </div>
        {totalResults !== undefined && (
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
            {totalResults} {totalResults === 1 ? "venue" : "venues"} found
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <label
            htmlFor="venue-category-filter"
            className="mb-1.5 block text-xs font-bold text-[var(--foreground)]"
          >
            Category
          </label>
          <select
            id="venue-category-filter"
            name="category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full rounded-md border-2 border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="venue-radius-filter"
            className="mb-1.5 block text-xs font-bold text-[var(--foreground)]"
          >
            Search Radius
          </label>
          <select
            id="venue-radius-filter"
            name="radiusMeters"
            value={radiusMeters}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="w-full rounded-md border-2 border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            {RADIUS_OPTIONS.map((meters) => (
              <option key={meters} value={meters}>
                {meters >= 1000 ? `${meters / 1000} km` : `${meters} m`}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-1 pt-1">
          <label
            htmlFor="step-free-filter"
            className="flex cursor-pointer items-center gap-2.5 rounded-md border-2 border-[var(--border)] bg-[var(--muted)]/40 p-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            <input
              type="checkbox"
              id="step-free-filter"
              name="stepFreeOnly"
              checked={stepFreeOnly}
              onChange={(e) => onStepFreeOnlyChange(e.target.checked)}
              className="h-4 w-4 rounded border-2 border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)] focus:ring-offset-2"
            />
            <span>Has verified step-free entrance</span>
          </label>
        </div>
      </div>
    </section>
  );
}
