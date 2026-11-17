"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { MobilityProfile } from "@pathpulse/shared-types";
import { useAuth } from "@/lib/auth/auth-context";
import { useA11y, TextScaleOption } from "@/lib/a11y/a11y-context";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, error, reloadSession } = useAuth();
  const { setTextScale, setHighContrast } = useA11y();

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

  if (isLoading) {
    return (
      <main id="main-content" className="flex-1 p-4 py-8" aria-busy="true">
        <div className="mx-auto max-w-3xl space-y-8 animate-pulse">
          <div className="space-y-2">
            <div className="h-8 w-72 bg-[var(--muted)] rounded-md" />
            <div className="h-4 w-96 bg-[var(--muted)] rounded-md" />
          </div>
          <div className="h-40 bg-[var(--card)] border border-[var(--border)] rounded-xl" />
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
          <Alert variant="destructive">
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => reloadSession()}>Retry Connection</Button>
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

        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Your registered identity and account role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-[var(--foreground)]">Name: </span>
                <span className="text-[var(--muted-foreground)]">{user.name}</span>
              </div>
              <div>
                <span className="font-semibold text-[var(--foreground)]">Email: </span>
                <span className="text-[var(--muted-foreground)]">{user.email}</span>
              </div>
              <div>
                <span className="font-semibold text-[var(--foreground)]">Role: </span>
                <span className="text-[var(--muted-foreground)]">{user.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation & Accessibility Settings</CardTitle>
            <CardDescription>
              PathPulse adapts routing engine penalties and UI contrast based on these options.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {successMessage && (
                <Alert
                  role="status"
                  className="border-green-600 bg-green-50 text-green-900 font-semibold"
                >
                  <AlertTitle>Saved</AlertTitle>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="pref-mobility-profile">Mobility Profile</Label>
                <Select
                  id="pref-mobility-profile"
                  value={mobilityProfile}
                  onChange={(e) => setMobilityProfile(e.target.value as MobilityProfile)}
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
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <Label htmlFor="pref-text-scale">Display Text Scale</Label>
                <Select
                  id="pref-text-scale"
                  value={String(textScaleVal)}
                  onChange={(e) => setTextScaleVal(parseFloat(e.target.value))}
                >
                  <option value="1">100% (Standard root font)</option>
                  <option value="1.25">125% (Large)</option>
                  <option value="1.5">150% (Extra Large)</option>
                  <option value="1.75">175% (Maximum Readable)</option>
                  <option value="2">200% (Double Scale)</option>
                </Select>
              </div>

              <Button type="submit" disabled={isSaving} className="mt-4">
                {isSaving ? "Saving Preferences..." : "Save Preferences"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </main>
  );
}
