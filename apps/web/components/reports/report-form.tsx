"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { IssueReportItem, ReportCategory } from "@pathpulse/shared-types";
import {
  ALLOWED_EVIDENCE_MIME_TYPES,
  MAX_DESCRIPTION_LENGTH,
  MAX_EVIDENCE_SIZE_BYTES,
  MIN_DESCRIPTION_LENGTH,
  MIN_EVIDENCE_SIZE_BYTES,
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  REPORT_STATUS_LABELS,
} from "@pathpulse/validation";
import { getVenues } from "@/lib/api/venues";
import {
  completeEvidence,
  createEvidence,
  createReport,
  uploadPhotoToPresignedUrl,
} from "@/lib/api/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SelectedPhoto {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  type: "image/jpeg" | "image/png" | "image/webp";
  uploadProgress: number;
  status: "pending" | "uploading" | "verifying" | "completed" | "failed";
  errorMessage?: string;
}

export function ReportForm() {
  const searchParams = useSearchParams();
  const initialVenueId = searchParams.get("venueId") || "";
  const initialFacilityId = searchParams.get("facilityId") || "";

  const [category, setCategory] = React.useState<ReportCategory>("BROKEN_LIFT");
  const [description, setDescription] = React.useState("");
  const [venueId, setVenueId] = React.useState(initialVenueId);
  const [facilityId, setFacilityId] = React.useState(initialFacilityId);
  const [latitude, setLatitude] = React.useState("");
  const [longitude, setLongitude] = React.useState("");
  const [photos, setPhotos] = React.useState<SelectedPhoto[]>([]);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = React.useState("");
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [submittedReport, setSubmittedReport] = React.useState<IssueReportItem | null>(null);

  const { data: venues = [], isLoading: isLoadingVenues } = useQuery({
    queryKey: ["venues-list"],
    queryFn: () => getVenues({ limit: 50 }),
  });

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const selectedVenue = React.useMemo(() => {
    return venues.find((v) => v.id === venueId);
  }, [venues, venueId]);

  const availableFacilities = React.useMemo(() => {
    return selectedVenue?.facilities || [];
  }, [selectedVenue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 5) {
      setFormError("You can attach a maximum of 5 photographs per report.");
      setLiveAnnouncement("Error: Maximum of 5 photographs per report allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const newPhotos: SelectedPhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const isAllowedType = ALLOWED_EVIDENCE_MIME_TYPES.includes(
        file.type as "image/jpeg" | "image/png" | "image/webp",
      );

      if (!isAllowedType) {
        setFormError(
          `File "${file.name}" is not an accepted format. Please select JPEG, PNG, or WebP.`,
        );
        setLiveAnnouncement(`Error: File ${file.name} is not an accepted format.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (file.size < MIN_EVIDENCE_SIZE_BYTES) {
        setFormError(`File "${file.name}" is too small (minimum 1 KB).`);
        setLiveAnnouncement(`Error: File ${file.name} is smaller than 1 KB.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (file.size > MAX_EVIDENCE_SIZE_BYTES) {
        setFormError(`File "${file.name}" exceeds the 5 MB size limit.`);
        setLiveAnnouncement(`Error: File ${file.name} exceeds 5 MB.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      newPhotos.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        sizeBytes: file.size,
        type: file.type as "image/jpeg" | "image/png" | "image/webp",
        uploadProgress: 0,
        status: "pending",
      });
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    setLiveAnnouncement(`${newPhotos.length} photo${newPhotos.length > 1 ? "s" : ""} added.`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const photoToRemove = prev.find((p) => p.id === photoId);
      const filtered = prev.filter((p) => p.id !== photoId);
      if (photoToRemove) {
        setLiveAnnouncement(`Removed photo ${photoToRemove.name}.`);
      }
      return filtered;
    });
  };

  const reportMutation = useMutation({
    mutationFn: async () => {
      setFormError(null);
      const trimmedDesc = description.trim();

      if (!trimmedDesc || trimmedDesc.length < MIN_DESCRIPTION_LENGTH) {
        throw new Error(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`);
      }

      if (trimmedDesc.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`);
      }

      if (!venueId && !facilityId) {
        throw new Error("Please select a venue or facility for this report.");
      }

      const parsedLat = latitude.trim() ? parseFloat(latitude.trim()) : undefined;
      const parsedLng = longitude.trim() ? parseFloat(longitude.trim()) : undefined;

      if (parsedLat !== undefined && (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) {
        throw new Error("Latitude must be a valid number between -90 and 90.");
      }

      if (parsedLng !== undefined && (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180)) {
        throw new Error("Longitude must be a valid number between -180 and 180.");
      }

      setLiveAnnouncement("Submitting barrier report...");

      const created = await createReport({
        category,
        description: trimmedDesc,
        venueId: venueId || undefined,
        facilityId: facilityId || undefined,
        latitude: parsedLat,
        longitude: parsedLng,
      });

      if (photos.length > 0) {
        setLiveAnnouncement(`Report created. Uploading ${photos.length} photograph(s)...`);

        for (let idx = 0; idx < photos.length; idx++) {
          const photo = photos[idx]!;

          try {
            setPhotos((prev) =>
              prev.map((p) =>
                p.id === photo.id ? { ...p, status: "uploading", uploadProgress: 10 } : p,
              ),
            );

            const { evidenceId, uploadUrl } = await createEvidence(created.id, {
              contentType: photo.type,
              sizeBytes: photo.sizeBytes,
            });

            await uploadPhotoToPresignedUrl(uploadUrl, photo.file, (percent) => {
              setPhotos((prev) =>
                prev.map((p) =>
                  p.id === photo.id ? { ...p, uploadProgress: Math.max(10, percent) } : p,
                ),
              );
            });

            setPhotos((prev) =>
              prev.map((p) =>
                p.id === photo.id ? { ...p, status: "verifying", uploadProgress: 100 } : p,
              ),
            );

            await completeEvidence(evidenceId);

            setPhotos((prev) =>
              prev.map((p) => (p.id === photo.id ? { ...p, status: "completed" } : p)),
            );
          } catch (uploadErr: unknown) {
            const msg = uploadErr instanceof Error ? uploadErr.message : "Upload failed";
            setPhotos((prev) =>
              prev.map((p) =>
                p.id === photo.id ? { ...p, status: "failed", errorMessage: msg } : p,
              ),
            );
            throw new Error(`Failed uploading photo "${photo.name}": ${msg}`);
          }
        }
      }

      return created;
    },
    onSuccess: (data) => {
      setSubmittedReport(data);
      setLiveAnnouncement(
        `Report submitted successfully. Your tracking code is ${data.tracking_code}.`,
      );
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setFormError(msg);
      setLiveAnnouncement(`Submission failed: ${msg}`);
    },
  });

  const handleCopyTrackingCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setLiveAnnouncement("Tracking code copied to clipboard.");
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      setLiveAnnouncement("Failed to copy code automatically. Please copy the text manually.");
    }
  };

  if (submittedReport) {
    const statusMeta = REPORT_STATUS_LABELS[submittedReport.status] || {
      label: "Submitted",
      explanation: "Your report has been received and is queued for verification.",
    };

    return (
      <Card className="w-full max-w-2xl mx-auto my-8 border-2 border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-2xl text-[var(--foreground)]">
            Report Submitted Successfully
          </CardTitle>
          <CardDescription>
            Thank you for helping keep PathPulse accurate and accessible for everyone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            role="region"
            aria-label="Report Tracking Details"
            className="p-5 rounded-lg border-2 border-[var(--border)] bg-[var(--muted)] space-y-3"
          >
            <div>
              <span className="block text-sm font-medium text-[var(--muted-foreground)]">
                Tracking Code
              </span>
              <div className="flex items-center space-x-3 mt-1">
                <span
                  id="tracking-code-display"
                  className="text-2xl font-mono font-bold tracking-wider text-[var(--foreground)] select-all"
                >
                  {submittedReport.tracking_code}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyTrackingCode(submittedReport.tracking_code)}
                  aria-label="Copy tracking code to clipboard"
                >
                  {copiedCode ? "Copied!" : "Copy Code"}
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)]">
              <span className="block text-sm font-medium text-[var(--muted-foreground)]">
                Current Status
              </span>
              <span className="inline-block mt-1 font-semibold text-[var(--foreground)]">
                {statusMeta.label}
              </span>
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                {statusMeta.explanation}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`/reports/${submittedReport.id}`}
              className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              View Report Details
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center justify-center rounded-md border-2 border-[var(--border)] bg-transparent text-[var(--foreground)] px-4 py-2 font-semibold hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              View My Reports
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSubmittedReport(null);
                setDescription("");
                setPhotos([]);
                setFormError(null);
              }}
            >
              Submit Another Report
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const charCount = description.trim().length;

  return (
    <Card className="w-full max-w-2xl mx-auto my-8 border-2 border-[var(--border)]">
      <CardHeader>
        <CardTitle className="text-2xl text-[var(--foreground)]">
          Report an Accessibility Barrier
        </CardTitle>
        <CardDescription>
          Provide location details and describe the barrier. You may attach up to 5 photographs
          directly to storage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div aria-live="polite" className="sr-only" role="status">
          {liveAnnouncement}
        </div>

        {formError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Submission Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            reportMutation.mutate();
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="barrier-category">Barrier Category *</Label>
            <select
              id="barrier-category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full h-11 px-3 py-2 rounded-md border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              {REPORT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {REPORT_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue-select">Venue *</Label>
            <select
              id="venue-select"
              name="venueId"
              value={venueId}
              onChange={(e) => {
                setVenueId(e.target.value);
                setFacilityId("");
              }}
              disabled={isLoadingVenues}
              className="w-full h-11 px-3 py-2 rounded-md border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <option value="">-- Select a Venue --</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.category})
                </option>
              ))}
            </select>
          </div>

          {availableFacilities.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="facility-select">Facility (Optional)</Label>
              <select
                id="facility-select"
                name="facilityId"
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full h-11 px-3 py-2 rounded-md border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                <option value="">-- Entire venue or general area --</option>
                {availableFacilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.facility_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="report-description">Description of Barrier *</Label>
              <span
                id="char-count"
                aria-live="polite"
                className="text-sm font-medium text-[var(--muted-foreground)]"
              >
                {charCount} / {MAX_DESCRIPTION_LENGTH} (min {MIN_DESCRIPTION_LENGTH})
              </span>
            </div>
            <textarea
              id="report-description"
              name="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is broken, blocked, or missing, and how it impacts access..."
              aria-describedby="char-count"
              className="w-full p-3 rounded-md border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>

          <fieldset className="border-2 border-[var(--border)] p-4 rounded-md space-y-4">
            <legend className="px-2 font-semibold text-sm text-[var(--foreground)]">
              Map Coordinates (Optional)
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="latitude-input">Latitude (-90 to 90)</Label>
                <Input
                  id="latitude-input"
                  name="latitude"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 12.9716"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="longitude-input">Longitude (-180 to 180)</Label>
                <Input
                  id="longitude-input"
                  name="longitude"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 77.5946"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          <div className="space-y-3">
            <Label htmlFor="photo-input">Photographs (Optional, max 5, up to 5 MB each)</Label>
            <input
              ref={fileInputRef}
              id="photo-input"
              name="photos"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={reportMutation.isPending || photos.length >= 5}
              className="w-full text-sm text-[var(--foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-2 file:border-[var(--border)] file:text-sm file:font-semibold file:bg-[var(--muted)] file:text-[var(--foreground)] hover:file:bg-[var(--accent)] cursor-pointer"
            />

            {photos.length > 0 && (
              <ul className="space-y-2 mt-2" aria-label="Selected photos">
                {photos.map((photo) => (
                  <li
                    key={photo.id}
                    className="flex items-center justify-between p-3 rounded-md border-2 border-[var(--border)] bg-[var(--muted)]"
                  >
                    <div className="flex flex-col pr-3 truncate">
                      <span className="text-sm font-semibold truncate text-[var(--foreground)]">
                        {photo.name}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {(photo.sizeBytes / 1024).toFixed(1)} KB &bull;{" "}
                        {photo.status === "uploading" && `Uploading: ${photo.uploadProgress}%`}
                        {photo.status === "verifying" && "Verifying on server..."}
                        {photo.status === "completed" && "Verified"}
                        {photo.status === "failed" && `Failed: ${photo.errorMessage || "Error"}`}
                        {photo.status === "pending" && "Ready to upload"}
                      </span>
                    </div>
                    {!reportMutation.isPending && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePhoto(photo.id)}
                        aria-label={`Remove photo ${photo.name}`}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        Remove
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={reportMutation.isPending}
              className="w-full h-12 text-base font-semibold"
            >
              {reportMutation.isPending ? "Submitting Report..." : "Submit Barrier Report"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
