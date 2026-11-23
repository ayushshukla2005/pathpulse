"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { MobilityProfile } from "@pathpulse/shared-types";
import { useAuth } from "@/lib/auth/auth-context";
import { useA11y, TextScaleOption } from "@/lib/a11y/a11y-context";
import { apiClient } from "@/lib/api/client";
import { GlassCard, GlassPanel, GlassButton } from "@/components/ui/glass";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ProfileTab = "account" | "navigation" | "accessibility";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, error, reloadSession } = useAuth();
  const { setTextScale, setHighContrast } = useA11y();

  const [activeTab, setActiveTab] = React.useState<ProfileTab>("account");
  const tabRefs = {
    account: React.useRef<HTMLButtonElement>(null),
    navigation: React.useRef<HTMLButtonElement>(null),
    accessibility: React.useRef<HTMLButtonElement>(null),
  };
  const TAB_ORDER: ProfileTab[] = ["account", "navigation", "accessibility"];

  const [mobilityProfile, setMobilityProfile] = React.useState<MobilityProfile>("DEFAULT");
  const [avoidStairs, setAvoidStairs] = React.useState(false);
  const [preferVoiceGuidance, setPreferVoiceGuidance] = React.useState(false);
  const [highContrastVal, setHighContrastVal] = React.useState(false);
  const [textScaleVal, setTextScaleVal] = React.useState(1.0);

  const [isSaving, setIsSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoading && !user && !error) {
      router.replace("/login?next=/profile");
    }
  }, [isLoading, user, error, router]);

  React.useEffect(() => {
    if (user?.preferences) {
      setMobilityProfile(user.preferences.mobility_profile || "DEFAULT");
      setAvoidStairs(user.preferences.avoid_stairs || false);
      setPreferVoiceGuidance(user.preferences.prefer_voice_guidance || false);
      setHighContrastVal(user.preferences.high_contrast || false);
      setTextScaleVal(user.preferences.text_scale || 1.0);
    }
  }, [user]);

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: ProfileTab) => {
    const currentIndex = TAB_ORDER.indexOf(currentTab);
    let nextIndex = currentIndex;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % TAB_ORDER.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = TAB_ORDER.length - 1;
    } else {
      return;
    }

    const nextTab = TAB_ORDER[nextIndex]!;
    setActiveTab(nextTab);
    tabRefs[nextTab].current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiClient("/users/preferences", {
        method: "PUT",
        body: JSON.stringify({
          mobilityProfile,
          avoidStairs,
          preferVoiceGuidance,
          highContrast: highContrastVal,
          textScale: textScaleVal,
        }),
      });

      await setHighContrast(highContrastVal);
      await setTextScale(String(textScaleVal) as TextScaleOption);
      await reloadSession();
      setSuccessMessage("Your preferences have been saved successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save preferences.";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const userInitials = React.useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user?.name]);

  if (isLoading) {
    return (
      <main id="main-content" className="flex-1 p-4 py-8" aria-busy="true">
        <div className="mx-auto max-w-3xl space-y-8 animate-pulse">
          <div className="space-y-2">
            <div className="h-8 w-72 bg-[var(--muted)] rounded-md" />
            <div className="h-4 w-96 bg-[var(--muted)] rounded-md" />
          </div>
          <div className="h-12 bg-[var(--card)] border border-[var(--border)] rounded-xl" />
          <div className="h-96 bg-[var(--card)] border border-[var(--border)] rounded-xl" />
        </div>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main id="main-content" className="flex-1 p-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              Account & Mobility Preferences
            </h1>
          </header>
          <GlassPanel
            role="alert"
            className="p-5 border-2 border-red-500 rounded-lg bg-red-50/80 text-red-900 dark:bg-red-950/80 dark:text-red-200"
          >
            <h2 className="text-lg font-bold">Connection Error</h2>
            <p className="mt-1 text-sm">{error}</p>
          </GlassPanel>
          <GlassButton type="button" onClick={() => reloadSession()} className="min-h-[24px]">
            Retry Connection
          </GlassButton>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main id="main-content" className="flex-1 p-4 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            Account & Mobility Preferences
          </h1>
          <p className="text-[var(--muted-foreground)] text-base">
            Customize routing requirements and accessibility display parameters.
          </p>
        </header>

        {successMessage && (
          <GlassPanel
            role="status"
            className="border-green-600 bg-green-50/80 text-green-900 font-semibold p-4"
          >
            <p className="font-bold">Saved</p>
            <p className="text-sm font-normal">{successMessage}</p>
          </GlassPanel>
        )}

        {errorMessage && (
          <GlassPanel
            role="alert"
            className="border-2 border-red-500 bg-red-50/80 text-red-900 dark:bg-red-950/80 dark:text-red-200 p-4"
          >
            <p className="font-bold">Error</p>
            <p className="text-sm">{errorMessage}</p>
          </GlassPanel>
        )}

        <div
          role="tablist"
          aria-label="Profile Sections"
          className="glass-panel flex space-x-2 rounded-xl p-1.5"
        >
          {TAB_ORDER.map((tab) => {
            const isSelected = activeTab === tab;
            const label =
              tab === "account" ? "Account" : tab === "navigation" ? "Navigation" : "Accessibility";
            return (
              <button
                key={tab}
                ref={tabRefs[tab]}
                role="tab"
                id={`tab-${tab}`}
                aria-controls={`panel-${tab}`}
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                type="button"
                onClick={() => setActiveTab(tab)}
                onKeyDown={(e) => handleTabKeyDown(e, tab)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                  isSelected
                    ? "bg-[var(--glass-surface)] text-[var(--foreground)] shadow-[var(--glass-shadow)] border border-[var(--glass-border)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div
            role="tabpanel"
            id="panel-account"
            aria-labelledby="tab-account"
            tabIndex={0}
            hidden={activeTab !== "account"}
            className="focus:outline-none"
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-5">
                <div
                  aria-hidden="true"
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xl font-bold text-[var(--primary-foreground)] shadow-sm"
                >
                  {userInitials}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">{user.name}</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">{user.email}</p>
                  <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)] uppercase">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)]">
                Account preferences and routing settings are tied to your registered identity.
              </div>
            </GlassCard>
          </div>

          <div
            role="tabpanel"
            id="panel-navigation"
            aria-labelledby="tab-navigation"
            tabIndex={0}
            hidden={activeTab !== "navigation"}
            className="focus:outline-none"
          >
            <GlassCard className="p-6 space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  Mobility & Route Preferences
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Configure default routing requirements for multi-floor navigation.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pref-mobility-profile">Mobility Profile</Label>
                <Select
                  id="pref-mobility-profile"
                  value={mobilityProfile}
                  onChange={(e) => setMobilityProfile(e.target.value as MobilityProfile)}
                  className="w-full min-h-[40px]"
                >
                  <option value="DEFAULT">Standard Pedestrian (No specific restrictions)</option>
                  <option value="WHEELCHAIR">
                    Manual Wheelchair (Requires step-free, strict slope & width)
                  </option>
                  <option value="POWERED_WHEELCHAIR">
                    Powered Wheelchair (Wide clearances, elevator required)
                  </option>
                  <option value="MOTORIZED">
                    Motorized Scooter (High turning radius, level paths)
                  </option>
                  <option value="CANE_OR_CRUTCHES">
                    Cane / Crutches (Minimizes distance & steep inclines)
                  </option>
                  <option value="STROLLER">
                    Stroller / Pram (Step-free, prefers ramps over crowded lifts)
                  </option>
                  <option value="VISUAL_IMPAIRMENT">
                    Visual Assistance (Prefers tactile edges & audio guidance)
                  </option>
                  <option value="ELDERLY">
                    Low Mobility / Senior (Shallow stairs acceptable, short steps)
                  </option>
                </Select>
              </div>

              <div className="space-y-4 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center space-x-3">
                  <input
                    id="pref-avoid-stairs"
                    type="checkbox"
                    checked={avoidStairs}
                    onChange={(e) => setAvoidStairs(e.target.checked)}
                    className="h-5 w-5 rounded border-2 border-[var(--border)] cursor-pointer"
                  />
                  <Label htmlFor="pref-avoid-stairs" className="cursor-pointer font-medium">
                    Strictly Avoid Stairs (Always route via ramps and operational elevators)
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    id="pref-voice-guidance"
                    type="checkbox"
                    checked={preferVoiceGuidance}
                    onChange={(e) => setPreferVoiceGuidance(e.target.checked)}
                    className="h-5 w-5 rounded border-2 border-[var(--border)] cursor-pointer"
                  />
                  <Label htmlFor="pref-voice-guidance" className="cursor-pointer font-medium">
                    Prefer Voice Guidance (Audio cues at upcoming transitions)
                  </Label>
                </div>
              </div>

              <GlassButton
                type="submit"
                disabled={isSaving}
                variant="primary"
                className="min-h-[40px] px-5 py-2 font-semibold"
              >
                {isSaving ? "Saving Preferences..." : "Save Preferences"}
              </GlassButton>
            </GlassCard>
          </div>

          <div
            role="tabpanel"
            id="panel-accessibility"
            aria-labelledby="tab-accessibility"
            tabIndex={0}
            hidden={activeTab !== "accessibility"}
            className="focus:outline-none"
          >
            <GlassCard className="p-6 space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  Display & Accessibility Parameters
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Adjust font scaling and high-contrast modes for maximum visibility.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    id="pref-high-contrast"
                    type="checkbox"
                    checked={highContrastVal}
                    onChange={(e) => setHighContrastVal(e.target.checked)}
                    className="h-5 w-5 rounded border-2 border-[var(--border)] cursor-pointer"
                  />
                  <Label htmlFor="pref-high-contrast" className="cursor-pointer font-medium">
                    High Contrast Display Theme (Maximum legibility 21:1 ratio)
                  </Label>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <Label htmlFor="pref-text-scale">Display Text Scale</Label>
                  <Select
                    id="pref-text-scale"
                    value={String(textScaleVal)}
                    onChange={(e) => setTextScaleVal(parseFloat(e.target.value))}
                    className="w-full min-h-[40px]"
                  >
                    <option value="1">100% (Standard root font)</option>
                    <option value="1.25">125% (Large)</option>
                    <option value="1.5">150% (Extra Large)</option>
                    <option value="1.75">175% (Maximum Readable)</option>
                    <option value="2">200% (Double Scale)</option>
                  </Select>
                </div>
              </div>

              <GlassButton
                type="submit"
                disabled={isSaving}
                variant="primary"
                className="min-h-[40px] px-5 py-2 font-semibold"
              >
                {isSaving ? "Saving Preferences..." : "Save Preferences"}
              </GlassButton>
            </GlassCard>
          </div>
        </form>
      </div>
    </main>
  );
}
