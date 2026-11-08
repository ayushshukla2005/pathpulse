import { useState } from "react";
import { Crosshair, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateLatitude, validateLongitude } from "@pathpulse/validation";

interface LocationCoordinates {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  location: LocationCoordinates | null;
  onLocationChange: (coords: LocationCoordinates | null) => void;
  onAnnounce?: (message: string) => void;
}

export function LocationPicker({ location, onLocationChange, onAnnounce }: LocationPickerProps) {
  const [latInput, setLatInput] = useState<string>(
    location?.lat !== undefined ? String(location.lat) : "",
  );
  const [lngInput, setLngInput] = useState<string>(
    location?.lng !== undefined ? String(location.lng) : "",
  );
  const [geoError, setGeoError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    setGeoError(null);
    setValidationError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const msg = "Geolocation is not supported by your browser.";
      setGeoError(msg);
      onAnnounce?.(msg);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const coords: LocationCoordinates = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        };
        setLatInput(String(coords.lat));
        setLngInput(String(coords.lng));
        onLocationChange(coords);
        const msg = `Location detected: latitude ${coords.lat}, longitude ${coords.lng}`;
        onAnnounce?.(msg);
      },
      (error) => {
        setIsLocating(false);
        let msg = "Could not retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission was denied. Please enter coordinates manually.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Location is currently unavailable. Please enter coordinates manually.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location request timed out. Please enter coordinates manually.";
        }
        setGeoError(msg);
        onAnnounce?.(msg);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const handleApplyManualCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    setGeoError(null);
    setValidationError(null);

    const latResult = validateLatitude(latInput);
    if (!latResult.isValid) {
      setValidationError(latResult.error || "Latitude must be between -90 and 90 degrees.");
      onAnnounce?.(latResult.error || "Invalid latitude");
      return;
    }

    const lngResult = validateLongitude(lngInput);
    if (!lngResult.isValid) {
      setValidationError(lngResult.error || "Longitude must be between -180 and 180 degrees.");
      onAnnounce?.(lngResult.error || "Invalid longitude");
      return;
    }

    const coords: LocationCoordinates = {
      lat: latResult.value!,
      lng: lngResult.value!,
    };
    onLocationChange(coords);
    const msg = `Location updated to latitude ${coords.lat}, longitude ${coords.lng}`;
    onAnnounce?.(msg);
  };

  const handleClearLocation = () => {
    setLatInput("");
    setLngInput("");
    setGeoError(null);
    setValidationError(null);
    onLocationChange(null);
    onAnnounce?.("Location cleared. Showing all venues.");
  };

  return (
    <section
      aria-labelledby="location-picker-heading"
      className="rounded-lg border-2 border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between border-b-2 border-[var(--border)] pb-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
          <h2 id="location-picker-heading" className="text-base font-bold text-[var(--foreground)]">
            Your Location
          </h2>
        </div>
        {location && (
          <button
            type="button"
            onClick={handleClearLocation}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded px-1.5 py-0.5"
            aria-label="Clear location filter"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <Crosshair className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{isLocating ? "Detecting location..." : "Use my current location"}</span>
        </Button>

        {geoError && (
          <div
            role="alert"
            className="rounded-md border border-amber-600 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-100"
          >
            {geoError}
          </div>
        )}

        <form onSubmit={handleApplyManualCoordinates} className="space-y-3 pt-1">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">
            Or specify coordinates manually:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="manual-lat"
                className="mb-1 block text-xs font-bold text-[var(--foreground)]"
              >
                Latitude
              </label>
              <input
                id="manual-lat"
                name="latitude"
                type="text"
                inputMode="decimal"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                placeholder="e.g. 12.9716"
                aria-describedby={validationError ? "manual-coords-error" : undefined}
                className="w-full rounded-md border-2 border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label
                htmlFor="manual-lng"
                className="mb-1 block text-xs font-bold text-[var(--foreground)]"
              >
                Longitude
              </label>
              <input
                id="manual-lng"
                name="longitude"
                type="text"
                inputMode="decimal"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                placeholder="e.g. 77.5946"
                aria-describedby={validationError ? "manual-coords-error" : undefined}
                className="w-full rounded-md border-2 border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
            </div>
          </div>

          {validationError && (
            <div
              id="manual-coords-error"
              role="alert"
              className="rounded-md border border-red-600 bg-red-50 p-2 text-xs font-medium text-red-900 dark:border-red-500 dark:bg-red-950 dark:text-red-100"
            >
              {validationError}
            </div>
          )}

          <Button type="submit" variant="secondary" className="w-full text-xs font-semibold py-1.5">
            Apply coordinates
          </Button>
        </form>

        {location && (
          <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/50 p-2 text-xs text-[var(--foreground)]">
            <span className="font-semibold">Active search center:</span> {location.lat},{" "}
            {location.lng}
          </div>
        )}
      </div>
    </section>
  );
}
