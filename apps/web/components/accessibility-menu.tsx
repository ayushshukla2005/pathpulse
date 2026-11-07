"use client";

import * as React from "react";
import { useA11y, TextScaleOption } from "@/lib/a11y/a11y-context";

export function AccessibilityMenu() {
  const { preferences, setTextScale, setHighContrast, setReducedMotion } = useA11y();
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const currentScaleOption: TextScaleOption =
    preferences.textScale === 0.875
      ? "0.875"
      : preferences.textScale === 1.25
        ? "1.25"
        : preferences.textScale === 1.5
          ? "1.5"
          : "1";

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        id="a11y-menu-button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="a11y-menu-panel"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center justify-center rounded-md border-2 border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
      >
        <span aria-hidden="true" className="mr-2">
          ♿
        </span>
        <span>Accessibility</span>
      </button>

      {isOpen && (
        <div
          id="a11y-menu-panel"
          role="region"
          aria-label="Accessibility settings"
          className="absolute right-0 z-50 mt-2 w-72 rounded-lg border-2 border-[var(--border)] bg-[var(--card)] p-4 shadow-lg text-[var(--card-foreground)]"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="a11y-text-size-select" className="block text-sm font-semibold mb-1">
                Text Size
              </label>
              <select
                id="a11y-text-size-select"
                value={currentScaleOption}
                onChange={(e) => setTextScale(e.target.value as TextScaleOption)}
                className="w-full h-10 rounded-md border-2 border-[var(--input)] bg-[var(--background)] px-2 text-sm text-[var(--foreground)]"
              >
                <option value="0.875">Small (87.5%)</option>
                <option value="1">Default (100%)</option>
                <option value="1.25">Large (125%)</option>
                <option value="1.5">Extra Large (150%)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label
                htmlFor="a11y-high-contrast-toggle"
                className="text-sm font-semibold cursor-pointer"
              >
                High Contrast
              </label>
              <input
                id="a11y-high-contrast-toggle"
                type="checkbox"
                checked={preferences.highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="h-5 w-5 rounded border-2 border-[var(--border)] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <label
                htmlFor="a11y-reduced-motion-toggle"
                className="text-sm font-semibold cursor-pointer"
              >
                Reduced Motion
              </label>
              <input
                id="a11y-reduced-motion-toggle"
                type="checkbox"
                checked={preferences.reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="h-5 w-5 rounded border-2 border-[var(--border)] cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-[var(--border)] flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-[var(--border)] px-3 py-1 text-xs font-semibold hover:bg-[var(--muted)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
