import type {
  FloorSummary,
  FindVenuesParams,
  VenueDetail,
  VenueListItem,
} from "@pathpulse/shared-types";
import { buildVenueSearchParams } from "@pathpulse/validation";
import { apiClient } from "./client";

export async function getVenues(params: FindVenuesParams = {}): Promise<VenueListItem[]> {
  const searchObj = buildVenueSearchParams(params);
  const searchParams = new URLSearchParams(searchObj);
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/venues?${queryString}` : "/venues";

  return apiClient<VenueListItem[]>(endpoint, {
    method: "GET",
    skipAuth: true,
  });
}

export async function getVenueById(id: string): Promise<VenueDetail> {
  const safeId = encodeURIComponent(id.trim());
  return apiClient<VenueDetail>(`/venues/${safeId}`, {
    method: "GET",
    skipAuth: true,
  });
}

export async function getBuildingFloors(buildingId: string): Promise<FloorSummary[]> {
  const safeBuildingId = encodeURIComponent(buildingId.trim());
  return apiClient<FloorSummary[]>(`/buildings/${safeBuildingId}/floors`, {
    method: "GET",
    skipAuth: true,
  });
}
