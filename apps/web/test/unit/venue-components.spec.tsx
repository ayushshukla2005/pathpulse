import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VerificationBadge } from "@/components/venues/verification-badge";
import { FacilityGroup } from "@/components/venues/facility-group";
import { LocationPicker } from "@/components/venues/location-picker";
import { FilterPanel } from "@/components/venues/filter-panel";
import type { FacilityItem } from "@pathpulse/shared-types";

describe("Venue Accessibility Components", () => {
  it("VerificationBadge renders the word 'Unverified' for UNVERIFIED facilities", () => {
    render(<VerificationBadge level="UNVERIFIED" status="OPERATIONAL" />);
    const badge = screen.getByText("Unverified");
    expect(badge).toBeInTheDocument();
    expect(screen.queryByText("Confirmed")).not.toBeInTheDocument();
  });

  it("VerificationBadge renders 'Unavailable' for out of service or unavailable facilities", () => {
    const { unmount } = render(<VerificationBadge level="CONFIRMED" status="OUT_OF_SERVICE" />);
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    unmount();

    render(<VerificationBadge level="UNAVAILABLE" status="OPERATIONAL" />);
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });

  it("FacilityGroup shows 'Never verified' when last_verified_at is null", () => {
    const unverifiedFacility: FacilityItem = {
      id: "f-test-1",
      venue_id: "v-1",
      building_id: "b-1",
      floor_id: "fl-1",
      node_id: "n-1",
      facility_type: "RAMP",
      name: "North Access Ramp",
      operational_status: "OPERATIONAL",
      verification_level: "UNVERIFIED",
      last_verified_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    render(<FacilityGroup facilities={[unverifiedFacility]} />);

    expect(screen.getByText("North Access Ramp")).toBeInTheDocument();
    expect(screen.getByText("Never verified")).toBeInTheDocument();
    expect(screen.getByText("Unverified")).toBeInTheDocument();
  });

  it("LocationPicker rejects latitude outside -90 to 90 with an accessible error", () => {
    const onLocationChange = vi.fn();
    const onAnnounce = vi.fn();

    render(
      <LocationPicker
        location={null}
        onLocationChange={onLocationChange}
        onAnnounce={onAnnounce}
      />,
    );

    const latInput = screen.getByLabelText(/latitude/i);
    const lngInput = screen.getByLabelText(/longitude/i);
    const applyButton = screen.getByRole("button", { name: /apply coordinates/i });

    fireEvent.change(latInput, { target: { value: "120" } });
    fireEvent.change(lngInput, { target: { value: "77.5" } });
    fireEvent.click(applyButton);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/between -90 and 90/i);
    expect(onLocationChange).not.toHaveBeenCalled();
  });

  it("FilterPanel controls have real labelled controls", () => {
    const onCategoryChange = vi.fn();
    const onRadiusChange = vi.fn();
    const onStepFreeOnlyChange = vi.fn();

    render(
      <FilterPanel
        category=""
        onCategoryChange={onCategoryChange}
        radiusMeters={1000}
        onRadiusChange={onRadiusChange}
        stepFreeOnly={false}
        onStepFreeOnlyChange={onStepFreeOnlyChange}
        totalResults={3}
      />,
    );

    const categorySelect = screen.getByLabelText(/category/i);
    expect(categorySelect).toBeInTheDocument();
    expect(categorySelect.tagName).toBe("SELECT");

    const radiusSelect = screen.getByLabelText(/search radius/i);
    expect(radiusSelect).toBeInTheDocument();
    expect(radiusSelect.tagName).toBe("SELECT");

    const stepFreeCheckbox = screen.getByLabelText(/has verified step-free entrance/i);
    expect(stepFreeCheckbox).toBeInTheDocument();
    expect(stepFreeCheckbox).toHaveAttribute("type", "checkbox");
  });
});
