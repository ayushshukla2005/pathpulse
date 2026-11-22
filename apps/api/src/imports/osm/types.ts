import { FacilityType } from "@prisma/client";

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  version: number;
  generator?: string;
  elements: OverpassElement[];
}

export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface MappedVenue {
  name: string;
  category: string;
  address: string | null;
  latitude: number;
  longitude: number;
  source: "OSM";
  sourceRef: string;
  sourceLicense: string;
}

export interface MappedBuilding {
  venueSourceRef: string;
  name: string;
  buildingCode: string | null;
  source: "OSM";
  sourceRef: string;
  sourceLicense: string;
}

export interface MappedFacility {
  venueSourceRef: string;
  name: string;
  facilityType: FacilityType;
  notes: string | null;
  operationalStatus: "UNKNOWN";
  verificationLevel: "UNVERIFIED";
  source: "OSM";
  sourceRef: string;
  sourceLicense: string;
}

export interface ImportResult {
  venuesProcessed: number;
  buildingsProcessed: number;
  facilitiesProcessed: number;
  venuesCreated: number;
  venuesUpdated: number;
  buildingsCreated: number;
  facilitiesCreated: number;
  facilitiesUpdated: number;
}
