import { Injectable, NotFoundException } from "@nestjs/common";
import { Venue } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateVenueDto } from "./dto/create-venue.dto";
import { FindVenuesQueryDto } from "./dto/find-venues-query.dto";

export interface VenueWithDistance extends Venue {
  distanceMeters?: number;
}

function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
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
  return Math.round(R * c);
}

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  clampQueryParams(query: FindVenuesQueryDto): {
    radius: number;
    limit: number;
  } {
    const radius = Math.min(Math.max(query.radiusMeters ?? 1000, 1), 10000);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    return { radius, limit };
  }

  async findVenues(query: FindVenuesQueryDto): Promise<VenueWithDistance[]> {
    const { radius, limit } = this.clampQueryParams(query);

    if (query.lat !== undefined && query.lng !== undefined) {
      try {
        if (query.category) {
          return await this.prisma.$queryRaw<VenueWithDistance[]>`
            SELECT id, organization_id, name, category, address, latitude, longitude,
                   created_at, updated_at,
                   ROUND(ST_Distance(location, ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography))::int AS "distanceMeters"
            FROM "venues"
            WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography, ${radius})
              AND category = ${query.category}
            ORDER BY "distanceMeters" ASC
            LIMIT ${limit};
          `;
        }

        return await this.prisma.$queryRaw<VenueWithDistance[]>`
          SELECT id, organization_id, name, category, address, latitude, longitude,
                 created_at, updated_at,
                 ROUND(ST_Distance(location, ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography))::int AS "distanceMeters"
          FROM "venues"
          WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography, ${radius})
          ORDER BY "distanceMeters" ASC
          LIMIT ${limit};
        `;
      } catch {
        const allVenues = await this.prisma.venue.findMany({
          where: query.category ? { category: query.category } : {},
        });

        const withDistance: VenueWithDistance[] = [];
        for (const v of allVenues) {
          const dist = calculateHaversineDistanceMeters(
            query.lat,
            query.lng,
            v.latitude,
            v.longitude,
          );
          if (dist <= radius) {
            withDistance.push({ ...v, distanceMeters: dist });
          }
        }

        withDistance.sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
        return withDistance.slice(0, limit);
      }
    }

    return this.prisma.venue.findMany({
      where: query.category ? { category: query.category } : {},
      take: limit,
      orderBy: { name: "asc" },
    });
  }

  async getVenueById(id: string): Promise<Venue> {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: { buildings: true },
    });

    if (!venue) {
      throw new NotFoundException("Venue not found");
    }

    return venue;
  }

  async createVenue(orgId: string, dto: CreateVenueDto): Promise<Venue> {
    const venue = await this.prisma.venue.create({
      data: {
        organization_id: orgId,
        name: dto.name,
        category: dto.category,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    try {
      await this.prisma.$executeRaw`
        UPDATE "venues"
        SET location = ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)::geography
        WHERE id = ${venue.id};
      `;
    } catch {
      return venue;
    }

    return venue;
  }
}
