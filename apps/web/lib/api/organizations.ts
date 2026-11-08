import { apiClient } from "./client";
import {
  FacilityItem,
  OrganizationBuildingsResponse,
  OrganizationDashboardMetrics,
  OrganizationFacilitiesResponse,
  OrganizationMaintenanceTasksResponse,
  UpdateFacilityStatusRequest,
} from "@pathpulse/shared-types";

export async function getOrganizationDashboard(
  orgId: string,
): Promise<OrganizationDashboardMetrics> {
  return apiClient<OrganizationDashboardMetrics>(`/organizations/${orgId}/dashboard`);
}

export async function getOrganizationBuildings(
  orgId: string,
): Promise<OrganizationBuildingsResponse> {
  return apiClient<OrganizationBuildingsResponse>(`/organizations/${orgId}/buildings`);
}

export async function getOrganizationFacilities(
  orgId: string,
  params: {
    buildingId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<OrganizationFacilitiesResponse> {
  const query = new URLSearchParams();
  if (params.buildingId) {
    query.set("buildingId", params.buildingId);
  }
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();
  const endpoint = queryString
    ? `/organizations/${orgId}/facilities?${queryString}`
    : `/organizations/${orgId}/facilities`;
  return apiClient<OrganizationFacilitiesResponse>(endpoint);
}

export async function getOrganizationMaintenanceTasks(
  orgId: string,
  params: {
    assigneeId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<OrganizationMaintenanceTasksResponse> {
  const query = new URLSearchParams();
  if (params.assigneeId) {
    query.set("assigneeId", params.assigneeId);
  }
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();
  const endpoint = queryString
    ? `/organizations/${orgId}/maintenance-tasks?${queryString}`
    : `/organizations/${orgId}/maintenance-tasks`;
  return apiClient<OrganizationMaintenanceTasksResponse>(endpoint);
}

export async function updateFacilityStatus(
  facilityId: string,
  data: UpdateFacilityStatusRequest,
): Promise<FacilityItem> {
  return apiClient<FacilityItem>(`/facilities/${facilityId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
