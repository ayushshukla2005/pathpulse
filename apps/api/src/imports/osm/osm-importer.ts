import { DataSource, OperationalStatus, PrismaClient, VerificationLevel } from "@prisma/client";
import { extractOsmElements } from "./osm-mapper";
import { ImportResult, OverpassResponse } from "./types";

export class OsmImporter {
  constructor(private readonly prisma: PrismaClient) {}

  async importOverpassData(data: OverpassResponse): Promise<ImportResult> {
    const { venues, buildings, facilities } = extractOsmElements(data.elements);

    let venuesCreated = 0;
    let venuesUpdated = 0;
    let buildingsCreated = 0;
    let facilitiesCreated = 0;
    let facilitiesUpdated = 0;

    const venueIdBySourceRef = new Map<string, string>();

    for (const v of venues) {
      const existing = await this.prisma.venue.findUnique({
        where: {
          source_sourceRef: {
            source: DataSource.OSM,
            sourceRef: v.sourceRef,
          },
        },
      });

      if (existing) {
        venuesUpdated++;
        const updated = await this.prisma.venue.update({
          where: { id: existing.id },
          data: {
            name: v.name,
            category: v.category,
            address: v.address,
            latitude: v.latitude,
            longitude: v.longitude,
            sourceLicense: v.sourceLicense,
          },
        });
        venueIdBySourceRef.set(v.sourceRef, updated.id);

        try {
          await this.prisma.$executeRaw`
            UPDATE "venues"
            SET location = ST_SetSRID(ST_MakePoint(${v.longitude}, ${v.latitude}), 4326)::geography
            WHERE id = ${updated.id};
          `;
        } catch (err: unknown) {
          void err;
        }
      } else {
        venuesCreated++;
        const created = await this.prisma.venue.create({
          data: {
            name: v.name,
            category: v.category,
            address: v.address,
            latitude: v.latitude,
            longitude: v.longitude,
            source: DataSource.OSM,
            sourceRef: v.sourceRef,
            sourceLicense: v.sourceLicense,
          },
        });
        venueIdBySourceRef.set(v.sourceRef, created.id);

        try {
          await this.prisma.$executeRaw`
            UPDATE "venues"
            SET location = ST_SetSRID(ST_MakePoint(${v.longitude}, ${v.latitude}), 4326)::geography
            WHERE id = ${created.id};
          `;
        } catch (err: unknown) {
          void err;
        }
      }
    }

    for (const b of buildings) {
      const venueId = venueIdBySourceRef.get(b.venueSourceRef);
      if (!venueId) continue;

      const existingBuilding = await this.prisma.building.findUnique({
        where: {
          source_sourceRef: {
            source: DataSource.OSM,
            sourceRef: b.sourceRef,
          },
        },
      });

      if (existingBuilding) {
        await this.prisma.building.update({
          where: { id: existingBuilding.id },
          data: {
            name: b.name,
            building_code: b.buildingCode,
            sourceLicense: b.sourceLicense,
          },
        });
      } else {
        buildingsCreated++;
        await this.prisma.building.create({
          data: {
            venue_id: venueId,
            name: b.name,
            building_code: b.buildingCode,
            source: DataSource.OSM,
            sourceRef: b.sourceRef,
            sourceLicense: b.sourceLicense,
          },
        });
      }
    }

    for (const f of facilities) {
      const venueId = venueIdBySourceRef.get(f.venueSourceRef);
      if (!venueId) continue;

      const existingFacility = await this.prisma.facility.findUnique({
        where: {
          source_sourceRef: {
            source: DataSource.OSM,
            sourceRef: f.sourceRef,
          },
        },
      });

      if (existingFacility) {
        facilitiesUpdated++;
        await this.prisma.facility.update({
          where: { id: existingFacility.id },
          data: {
            name: f.name,
            facility_type: f.facilityType,
            notes: f.notes,
            sourceLicense: f.sourceLicense,
          },
        });
      } else {
        facilitiesCreated++;
        await this.prisma.facility.create({
          data: {
            venue_id: venueId,
            name: f.name,
            facility_type: f.facilityType,
            notes: f.notes,
            operational_status: OperationalStatus.UNKNOWN,
            verification_level: VerificationLevel.UNVERIFIED,
            source: DataSource.OSM,
            sourceRef: f.sourceRef,
            sourceLicense: f.sourceLicense,
          },
        });
      }
    }

    return {
      venuesProcessed: venues.length,
      buildingsProcessed: buildings.length,
      facilitiesProcessed: facilities.length,
      venuesCreated,
      venuesUpdated,
      buildingsCreated,
      facilitiesCreated,
      facilitiesUpdated,
    };
  }
}
