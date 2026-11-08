import type {
  BuildingNavigationGraph,
  FindRouteRequest,
  FloorDetail,
  FloorSummary,
  RoutePlanResult,
  RouteSuccessResponse,
} from "@pathpulse/shared-types";
import { apiClient } from "./client";
import { ApiError } from "./errors";

export async function postRoute(request: FindRouteRequest): Promise<RoutePlanResult> {
  try {
    const response = await apiClient<RouteSuccessResponse>("/routes", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.statusCode === 422) {
        return {
          status: "NO_CONFIRMED_ROUTE",
          reason:
            typeof error.details === "string"
              ? error.details
              : Array.isArray(error.details)
                ? error.details.join(", ")
                : error.message || "No confirmed route available for the chosen mobility profile.",
        };
      }
      if (error.statusCode === 404) {
        return {
          status: "NOT_FOUND",
          reason:
            typeof error.details === "string"
              ? error.details
              : Array.isArray(error.details)
                ? error.details.join(", ")
                : error.message || "Building or node not found.",
        };
      }
      if (error.statusCode === 400) {
        return {
          status: "BAD_REQUEST",
          reason:
            typeof error.details === "string"
              ? error.details
              : Array.isArray(error.details)
                ? error.details.join(", ")
                : error.message || "Invalid route request.",
        };
      }
    }
    throw error;
  }
}

export async function getBuildingMap(buildingId: string): Promise<BuildingNavigationGraph> {
  return apiClient<BuildingNavigationGraph>(`/buildings/${buildingId}/map`);
}

export async function getBuildingFloors(buildingId: string): Promise<FloorSummary[]> {
  return apiClient<FloorSummary[]>(`/buildings/${buildingId}/floors`);
}

export async function getFloorDetails(buildingId: string, floorId: string): Promise<FloorDetail> {
  return apiClient<FloorDetail>(`/buildings/${buildingId}/floors/${floorId}`);
}
