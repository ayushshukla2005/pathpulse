import { FacilityType } from "@prisma/client";
import { MappedBuilding, MappedFacility, MappedVenue, OverpassElement } from "./types";

export const OSM_ATTRIBUTION = "© OpenStreetMap contributors (ODbL 1.0)";

export interface ExtractionResult {
  venues: MappedVenue[];
  buildings: MappedBuilding[];
  facilities: MappedFacility[];
}

function getCoordinates(element: OverpassElement): { lat: number; lon: number } | null {
  if (element.lat !== undefined && element.lon !== undefined) {
    return { lat: element.lat, lon: element.lon };
  }
  if (element.center && element.center.lat !== undefined && element.center.lon !== undefined) {
    return { lat: element.center.lat, lon: element.center.lon };
  }
  return null;
}

function buildAddress(tags: Record<string, string>): string | null {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"] || tags["addr:suburb"],
    tags["addr:postcode"],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : null;
}

function isVenueElement(tags: Record<string, string>): boolean {
  if (
    tags["amenity"] === "hospital" ||
    tags["amenity"] === "university" ||
    tags["amenity"] === "college" ||
    tags["public_transport"] === "station" ||
    tags["railway"] === "station" ||
    tags["shop"] === "mall"
  ) {
    return true;
  }
  return false;
}

function determineVenueCategory(tags: Record<string, string>): string {
  if (tags["amenity"] === "hospital") return "HEALTHCARE";
  if (tags["amenity"] === "university" || tags["amenity"] === "college") return "EDUCATION";
  if (tags["public_transport"] === "station" || tags["railway"] === "station") return "TRANSIT";
  if (tags["shop"] === "mall") return "SHOPPING";
  return "PUBLIC";
}

function determineFacilityType(tags: Record<string, string>): FacilityType {
  if (tags["highway"] === "elevator") return FacilityType.ELEVATOR;
  if (tags["entrance"]) return FacilityType.ENTRANCE;
  if (tags["amenity"] === "toilets") return FacilityType.ACCESSIBLE_RESTROOM;
  if (tags["ramp"] === "yes") return FacilityType.RAMP;
  return FacilityType.OTHER;
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function extractOsmElements(elements: OverpassElement[]): ExtractionResult {
  const venues: MappedVenue[] = [];
  const buildings: MappedBuilding[] = [];
  const facilityCandidates: Array<{
    element: OverpassElement;
    coords: { lat: number; lon: number };
    facilityType: FacilityType;
    name: string;
    notes: string | null;
  }> = [];

  for (const el of elements) {
    const tags = el.tags || {};
    const coords = getCoordinates(el);
    if (!coords) continue;

    const sourceRef = `${el.type}/${el.id}`;

    if (isVenueElement(tags)) {
      const name =
        tags["name"] || tags["name:en"] || `${determineVenueCategory(tags)} (${sourceRef})`;

      venues.push({
        name,
        category: determineVenueCategory(tags),
        address: buildAddress(tags),
        latitude: coords.lat,
        longitude: coords.lon,
        source: "OSM",
        sourceRef,
        sourceLicense: OSM_ATTRIBUTION,
      });

      if (tags["building"]) {
        buildings.push({
          venueSourceRef: sourceRef,
          name: `${name} - Main Building`,
          buildingCode: tags["ref"] || null,
          source: "OSM",
          sourceRef: `building:${sourceRef}`,
          sourceLicense: OSM_ATTRIBUTION,
        });
      }

      if (tags["wheelchair"]) {
        facilityCandidates.push({
          element: el,
          coords,
          facilityType: FacilityType.ENTRANCE,
          name: `${name} Entrance`,
          notes: `wheelchair=${tags["wheelchair"]}`,
        });
      }
      continue;
    }

    const isElevator = tags["highway"] === "elevator";
    const isEntranceWithWheelchair = Boolean(tags["entrance"] && tags["wheelchair"]);
    const isAccessibleToilet = tags["amenity"] === "toilets" && Boolean(tags["wheelchair"]);
    const hasWheelchair = Boolean(tags["wheelchair"]);

    if (isElevator || isEntranceWithWheelchair || isAccessibleToilet || hasWheelchair) {
      const facilityType = determineFacilityType(tags);
      const defaultName =
        facilityType === FacilityType.ELEVATOR
          ? "Elevator"
          : facilityType === FacilityType.ENTRANCE
            ? "Entrance"
            : facilityType === FacilityType.ACCESSIBLE_RESTROOM
              ? "Accessible Restroom"
              : "Accessibility Feature";

      const name = tags["name"] || `${defaultName} (${sourceRef})`;
      const noteParts: string[] = [];
      if (tags["wheelchair"]) {
        noteParts.push(`wheelchair=${tags["wheelchair"]}`);
      }
      if (tags["wheelchair:description"]) {
        noteParts.push(tags["wheelchair:description"]);
      }
      const notes = noteParts.length > 0 ? noteParts.join("; ") : null;

      facilityCandidates.push({
        element: el,
        coords,
        facilityType,
        name,
        notes,
      });
    }
  }

  const facilities: MappedFacility[] = [];

  for (const candidate of facilityCandidates) {
    const candidateSourceRef = `${candidate.element.type}/${candidate.element.id}`;

    let closestVenue: MappedVenue | null = null;
    let minDistance = Infinity;

    for (const v of venues) {
      const dist = calculateDistanceMeters(
        candidate.coords.lat,
        candidate.coords.lon,
        v.latitude,
        v.longitude,
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestVenue = v;
      }
    }

    let targetVenueSourceRef: string;

    if (closestVenue && minDistance <= 300) {
      targetVenueSourceRef = closestVenue.sourceRef;
    } else {
      const syntheticVenueRef = `venue:${candidateSourceRef}`;
      venues.push({
        name: candidate.name,
        category: "PUBLIC",
        address: buildAddress(candidate.element.tags || {}),
        latitude: candidate.coords.lat,
        longitude: candidate.coords.lon,
        source: "OSM",
        sourceRef: syntheticVenueRef,
        sourceLicense: OSM_ATTRIBUTION,
      });
      targetVenueSourceRef = syntheticVenueRef;
    }

    facilities.push({
      venueSourceRef: targetVenueSourceRef,
      name: candidate.name,
      facilityType: candidate.facilityType,
      notes: candidate.notes,
      operationalStatus: "UNKNOWN",
      verificationLevel: "UNVERIFIED",
      source: "OSM",
      sourceRef: candidateSourceRef,
      sourceLicense: OSM_ATTRIBUTION,
    });
  }

  return { venues, buildings, facilities };
}
