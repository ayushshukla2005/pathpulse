import { describe, it, expect } from "vitest";
import {
  buildVenueSearchParams,
  computeVerificationSummary,
  formatVerificationSummary,
  validateLatitude,
  validateLongitude,
} from "@pathpulse/validation";
import type { FacilityItem } from "@pathpulse/shared-types";

describe("Venue Verification Summary Logic", () => {
  const sampleFacilities: FacilityItem[] = [
    {
      id: "f-1",
      venue_id: "v-1",
      building_id: "b-1",
      floor_id: "fl-0",
      node_id: "n-1",
      facility_type: "ENTRANCE",
      name: "Main Entrance",
      operational_status: "OPERATIONAL",
      verification_level: "CONFIRMED",
      last_verified_at: new Date("2026-10-10"),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: "f-2",
      venue_id: "v-1",
      building_id: "b-1",
      floor_id: "fl-0",
      node_id: "n-2",
      facility_type: "LIFT",
      name: "Main Lift",
      operational_status: "OPERATIONAL",
      verification_level: "CONFIRMED",
      last_verified_at: new Date("2026-10-10"),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: "f-3",
      venue_id: "v-1",
      building_id: "b-1",
      floor_id: "fl-0",
      node_id: "n-3",
      facility_type: "ACCESSIBLE_RESTROOM",
      name: "Ground Restroom",
      operational_status: "OPERATIONAL",
      verification_level: "UNVERIFIED",
      last_verified_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: "f-4",
      venue_id: "v-1",
      building_id: "b-1",
      floor_id: "fl-0",
      node_id: "n-4",
      facility_type: "RAMP",
      name: "Service Ramp",
      operational_status: "OUT_OF_SERVICE",
      verification_level: "UNAVAILABLE",
      last_verified_at: new Date("2026-10-10"),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  it("accurately counts facilities by level and never counts UNVERIFIED as CONFIRMED", () => {
    const summary = computeVerificationSummary(sampleFacilities);

    expect(summary.total).toBe(4);
    expect(summary.confirmed).toBe(2);
    expect(summary.unverified).toBe(1);
    expect(summary.unavailable).toBe(1);

    expect(summary.confirmed).not.toBe(3);
    expect(summary.confirmed).not.toBe(summary.total);
  });

  it("identifies verified operational step-free entrance", () => {
    const summary = computeVerificationSummary(sampleFacilities);
    expect(summary.hasStepFreeEntrance).toBe(true);

    const withoutStepFree: FacilityItem[] = [
      {
        id: "f-unverified-entrance",
        venue_id: "v-1",
        building_id: null,
        floor_id: null,
        node_id: null,
        facility_type: "ENTRANCE",
        name: "Side Door",
        operational_status: "OPERATIONAL",
        verification_level: "UNVERIFIED",
        last_verified_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const unverifiedSummary = computeVerificationSummary(withoutStepFree);
    expect(unverifiedSummary.hasStepFreeEntrance).toBe(false);
    expect(unverifiedSummary.confirmed).toBe(0);
    expect(unverifiedSummary.unverified).toBe(1);
  });

  it("handles empty or undefined facilities gracefully", () => {
    const emptySummary = computeVerificationSummary([]);
    expect(emptySummary.total).toBe(0);
    expect(emptySummary.confirmed).toBe(0);
    expect(emptySummary.unverified).toBe(0);
    expect(emptySummary.hasStepFreeEntrance).toBe(false);

    const undefinedSummary = computeVerificationSummary(undefined);
    expect(undefinedSummary.total).toBe(0);
    expect(formatVerificationSummary(undefinedSummary)).toBe("No facilities listed");
  });

  it("formats verification summary text cleanly", () => {
    const summary = computeVerificationSummary(sampleFacilities);
    const text = formatVerificationSummary(summary);
    expect(text).toContain("2 verified");
    expect(text).toContain("1 unverified");
    expect(text).toContain("1 unavailable");
  });
});

describe("Venue Search Parameter Builder", () => {
  it("omits lat and lng when location is absent or undefined", () => {
    const params = buildVenueSearchParams({
      radiusMeters: 2000,
      limit: 15,
      category: "CAMPUS",
    });

    expect(params.lat).toBeUndefined();
    expect(params.lng).toBeUndefined();
    expect(params.radiusMeters).toBe("2000");
    expect(params.limit).toBe("15");
    expect(params.category).toBe("CAMPUS");
  });

  it("includes lat and lng when valid coordinates are provided", () => {
    const params = buildVenueSearchParams({
      lat: 12.9716,
      lng: 77.5946,
      radiusMeters: 1000,
    });

    expect(params.lat).toBe("12.9716");
    expect(params.lng).toBe("77.5946");
    expect(params.radiusMeters).toBe("1000");
    expect(params.limit).toBe("20");
  });

  it("clamps radiusMeters within 1 to 10000 bounds", () => {
    const highRadius = buildVenueSearchParams({ radiusMeters: 999999 });
    expect(highRadius.radiusMeters).toBe("10000");

    const lowRadius = buildVenueSearchParams({ radiusMeters: -500 });
    expect(lowRadius.radiusMeters).toBe("1");

    const defaultRadius = buildVenueSearchParams({});
    expect(defaultRadius.radiusMeters).toBe("1000");
  });

  it("clamps limit within 1 to 100 bounds", () => {
    const highLimit = buildVenueSearchParams({ limit: 500 });
    expect(highLimit.limit).toBe("100");

    const lowLimit = buildVenueSearchParams({ limit: -5 });
    expect(lowLimit.limit).toBe("1");

    const defaultLimit = buildVenueSearchParams({});
    expect(defaultLimit.limit).toBe("20");
  });

  it("validates coordinates boundaries accurately", () => {
    expect(validateLatitude(45).isValid).toBe(true);
    expect(validateLatitude(-90).isValid).toBe(true);
    expect(validateLatitude(90).isValid).toBe(true);
    expect(validateLatitude(-91).isValid).toBe(false);
    expect(validateLatitude(91).isValid).toBe(false);
    expect(validateLatitude("invalid").isValid).toBe(false);

    expect(validateLongitude(0).isValid).toBe(true);
    expect(validateLongitude(-180).isValid).toBe(true);
    expect(validateLongitude(180).isValid).toBe(true);
    expect(validateLongitude(-181).isValid).toBe(false);
    expect(validateLongitude(181).isValid).toBe(false);
  });
});
