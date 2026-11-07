"use client";

import * as React from "react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export type TextScaleOption = "0.875" | "1" | "1.25" | "1.5" | "1.75" | "2";

export interface A11yPreferences {
  textScale: number;
  highContrast: boolean;
  reducedMotion: boolean;
}

interface A11yContextValue {
  preferences: A11yPreferences;
  announcement: string;
  setTextScale: (scale: TextScaleOption) => Promise<void>;
  setHighContrast: (enabled: boolean) => Promise<void>;
  setReducedMotion: (enabled: boolean) => Promise<void>;
}

const A11yContext = React.createContext<A11yContextValue | undefined>(undefined);

function readCookieA11y(): Partial<A11yPreferences> {
  if (typeof document === "undefined") return {};
  const match = document.cookie.split("; ").find((row) => row.startsWith("pp_a11y="));
  if (!match) return {};
  try {
    const rawVal = match.split("=")[1];
    if (!rawVal) return {};
    return JSON.parse(decodeURIComponent(rawVal));
  } catch {
    return {};
  }
}

function writeCookieA11y(prefs: A11yPreferences): void {
  if (typeof document === "undefined") return;
  const serialized = encodeURIComponent(JSON.stringify(prefs));
  document.cookie = `pp_a11y=${serialized}; path=/; max-age=31536000; SameSite=Lax`;
}

function applyDomA11y(prefs: A11yPreferences): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--text-scale", String(prefs.textScale));

  if (prefs.highContrast) {
    root.setAttribute("data-theme", "high-contrast");
  } else {
    root.removeAttribute("data-theme");
  }

  if (prefs.reducedMotion) {
    root.setAttribute("data-reduced-motion", "true");
  } else {
    root.removeAttribute("data-reduced-motion");
  }
}

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = React.useState<A11yPreferences>({
    textScale: 1.0,
    highContrast: false,
    reducedMotion: false,
  });
  const [announcement, setAnnouncement] = React.useState("");

  React.useEffect(() => {
    const cookiePrefs = readCookieA11y();
    const userPrefs = user?.preferences;

    const initial: A11yPreferences = {
      textScale: userPrefs?.text_scale ?? cookiePrefs.textScale ?? 1.0,
      highContrast: userPrefs?.high_contrast ?? cookiePrefs.highContrast ?? false,
      reducedMotion: cookiePrefs.reducedMotion ?? false,
    };

    setPreferences(initial);
    applyDomA11y(initial);
  }, [user]);

  const updatePreferences = async (
    updater: (prev: A11yPreferences) => A11yPreferences,
    message: string,
  ) => {
    const next = updater(preferences);
    setPreferences(next);
    applyDomA11y(next);
    writeCookieA11y(next);
    setAnnouncement(message);

    if (user) {
      try {
        await apiClient("/users/preferences", {
          method: "PUT",
          body: JSON.stringify({
            textScale: next.textScale,
            highContrast: next.highContrast,
          }),
        });
      } catch (err) {
        void err;
      }
    }
  };

  const setTextScale = async (scale: TextScaleOption) => {
    const num = parseFloat(scale);
    const labels: Record<string, string> = {
      "0.875": "Small",
      "1": "Default",
      "1.25": "Large",
      "1.5": "Extra Large",
    };
    await updatePreferences(
      (prev) => ({ ...prev, textScale: num }),
      `Text scale set to ${labels[scale] || scale}`,
    );
  };

  const setHighContrast = async (enabled: boolean) => {
    await updatePreferences(
      (prev) => ({ ...prev, highContrast: enabled }),
      enabled ? "High contrast enabled" : "High contrast disabled",
    );
  };

  const setReducedMotion = async (enabled: boolean) => {
    await updatePreferences(
      (prev) => ({ ...prev, reducedMotion: enabled }),
      enabled ? "Reduced motion enabled" : "Reduced motion disabled",
    );
  };

  return (
    <A11yContext.Provider
      value={{
        preferences,
        announcement,
        setTextScale,
        setHighContrast,
        setReducedMotion,
      }}
    >
      {children}
      <div
        id="a11y-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const context = React.useContext(A11yContext);
  if (!context) {
    throw new Error("useA11y must be used within an A11yProvider");
  }
  return context;
}
