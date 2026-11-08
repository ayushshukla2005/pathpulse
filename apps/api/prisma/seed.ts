import {
  ConnectionType,
  FacilityType,
  OperationalStatus,
  PrismaClient,
  UserRole,
  VerificationLevel,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const defaultPrisma = new PrismaClient();

export async function runSeed(customPrisma?: PrismaClient): Promise<void> {
  const client = customPrisma ?? defaultPrisma;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.trim().length === 0) {
    throw new Error("SEED_ADMIN_PASSWORD environment variable is required to run the seed script.");
  }

  const organization = await client.organization.upsert({
    where: { slug: "sample-campus-demo" },
    update: {
      name: "Sample Campus (Demo Data)",
    },
    create: {
      name: "Sample Campus (Demo Data)",
      slug: "sample-campus-demo",
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await client.user.upsert({
    where: { email: "demo-admin@pathpulse.local" },
    update: {
      name: "Demo Admin (Demo Data)",
      password_hash: passwordHash,
      role: UserRole.ORGANIZATION_ADMIN,
      organization_id: organization.id,
    },
    create: {
      email: "demo-admin@pathpulse.local",
      name: "Demo Admin (Demo Data)",
      password_hash: passwordHash,
      role: UserRole.ORGANIZATION_ADMIN,
      organization_id: organization.id,
    },
  });

  await client.organizationMember.upsert({
    where: {
      organization_id_user_id: {
        organization_id: organization.id,
        user_id: adminUser.id,
      },
    },
    update: {
      role: UserRole.ORGANIZATION_ADMIN,
    },
    create: {
      organization_id: organization.id,
      user_id: adminUser.id,
      role: UserRole.ORGANIZATION_ADMIN,
    },
  });

  await client.userPreference.upsert({
    where: { user_id: adminUser.id },
    update: {},
    create: {
      user_id: adminUser.id,
    },
  });

  let venue = await client.venue.findFirst({
    where: {
      organization_id: organization.id,
      name: "Central Campus (Demo)",
    },
  });

  if (!venue) {
    venue = await client.venue.create({
      data: {
        organization_id: organization.id,
        name: "Central Campus (Demo)",
        category: "CAMPUS",
        address: "123 Academic Way, Demo City",
        latitude: 12.9716,
        longitude: 77.5946,
      },
    });
  } else {
    venue = await client.venue.update({
      where: { id: venue.id },
      data: {
        category: "CAMPUS",
        address: "123 Academic Way, Demo City",
        latitude: 12.9716,
        longitude: 77.5946,
      },
    });
  }

  try {
    await client.$executeRaw`
      UPDATE venues
      SET location = ST_SetSRID(ST_MakePoint(${77.5946}, ${12.9716}), 4326)::geography
      WHERE id = ${venue.id}
    `;
  } catch (error) {
    void error;
  }

  let building = await client.building.findFirst({
    where: {
      venue_id: venue.id,
      name: "Science & Tech Building (Demo)",
    },
  });

  if (!building) {
    building = await client.building.create({
      data: {
        venue_id: venue.id,
        name: "Science & Tech Building (Demo)",
        building_code: "ST-01",
      },
    });
  } else {
    building = await client.building.update({
      where: { id: building.id },
      data: {
        building_code: "ST-01",
      },
    });
  }

  const floor0 = await client.floor.upsert({
    where: {
      building_id_floor_number: {
        building_id: building.id,
        floor_number: 0,
      },
    },
    update: {
      name: "Ground Floor (Demo)",
      level_index: 0,
    },
    create: {
      building_id: building.id,
      floor_number: 0,
      name: "Ground Floor (Demo)",
      level_index: 0,
    },
  });

  const floor1 = await client.floor.upsert({
    where: {
      building_id_floor_number: {
        building_id: building.id,
        floor_number: 1,
      },
    },
    update: {
      name: "First Floor (Demo)",
      level_index: 1,
    },
    create: {
      building_id: building.id,
      floor_number: 1,
      name: "First Floor (Demo)",
      level_index: 1,
    },
  });

  async function upsertNode(params: {
    floorId: string;
    nodeType: string;
    name: string;
    xCoordinate: number;
    yCoordinate: number;
    latitude?: number;
    longitude?: number;
  }) {
    const existing = await client.mapNode.findFirst({
      where: {
        building_id: building!.id,
        name: params.name,
      },
    });

    if (existing) {
      return client.mapNode.update({
        where: { id: existing.id },
        data: {
          floor_id: params.floorId,
          node_type: params.nodeType,
          x_coordinate: params.xCoordinate,
          y_coordinate: params.yCoordinate,
          latitude: params.latitude,
          longitude: params.longitude,
          is_accessible: true,
        },
      });
    }

    return client.mapNode.create({
      data: {
        building_id: building!.id,
        floor_id: params.floorId,
        node_type: params.nodeType,
        name: params.name,
        x_coordinate: params.xCoordinate,
        y_coordinate: params.yCoordinate,
        latitude: params.latitude,
        longitude: params.longitude,
        is_accessible: true,
      },
    });
  }

  const nodeEntrance = await upsertNode({
    floorId: floor0.id,
    nodeType: "ENTRANCE",
    name: "Main Entrance (Demo)",
    xCoordinate: 10,
    yCoordinate: 10,
    latitude: 12.9716,
    longitude: 77.5946,
  });

  const nodeRampStart = await upsertNode({
    floorId: floor0.id,
    nodeType: "RAMP_START",
    name: "Ground Ramp Start (Demo)",
    xCoordinate: 20,
    yCoordinate: 10,
  });

  const nodeLobby0 = await upsertNode({
    floorId: floor0.id,
    nodeType: "LOBBY",
    name: "Ground Lift Lobby (Demo)",
    xCoordinate: 30,
    yCoordinate: 10,
  });

  const nodeStairs0 = await upsertNode({
    floorId: floor0.id,
    nodeType: "STAIRS",
    name: "Ground Stairs (Demo)",
    xCoordinate: 35,
    yCoordinate: 10,
  });

  const nodeCorridor0 = await upsertNode({
    floorId: floor0.id,
    nodeType: "CORRIDOR",
    name: "Ground Corridor (Demo)",
    xCoordinate: 50,
    yCoordinate: 10,
  });

  const nodeRestroom0 = await upsertNode({
    floorId: floor0.id,
    nodeType: "RESTROOM",
    name: "Ground Restroom Node (Demo)",
    xCoordinate: 50,
    yCoordinate: 20,
  });

  const nodeLobby1 = await upsertNode({
    floorId: floor1.id,
    nodeType: "LOBBY",
    name: "First Floor Lift Lobby (Demo)",
    xCoordinate: 30,
    yCoordinate: 10,
  });

  const nodeStairs1 = await upsertNode({
    floorId: floor1.id,
    nodeType: "STAIRS",
    name: "First Floor Stairs (Demo)",
    xCoordinate: 35,
    yCoordinate: 10,
  });

  const nodeCorridor1 = await upsertNode({
    floorId: floor1.id,
    nodeType: "CORRIDOR",
    name: "First Floor Corridor (Demo)",
    xCoordinate: 50,
    yCoordinate: 10,
  });

  async function upsertEdge(params: {
    fromNodeId: string;
    toNodeId: string;
    connectionType: ConnectionType;
    distanceMeters: number;
    stepFree: boolean;
    widthCm?: number;
    slopePercent?: number;
    surface?: string;
  }) {
    return client.mapEdge.upsert({
      where: {
        from_node_id_to_node_id: {
          from_node_id: params.fromNodeId,
          to_node_id: params.toNodeId,
        },
      },
      update: {
        building_id: building!.id,
        connection_type: params.connectionType,
        distance_meters: params.distanceMeters,
        step_free: params.stepFree,
        width_cm: params.widthCm,
        slope_percent: params.slopePercent,
        surface: params.surface,
        operational_status: OperationalStatus.OPERATIONAL,
        verification_level: VerificationLevel.CONFIRMED,
      },
      create: {
        building_id: building!.id,
        from_node_id: params.fromNodeId,
        to_node_id: params.toNodeId,
        connection_type: params.connectionType,
        distance_meters: params.distanceMeters,
        step_free: params.stepFree,
        width_cm: params.widthCm,
        slope_percent: params.slopePercent,
        surface: params.surface,
        operational_status: OperationalStatus.OPERATIONAL,
        verification_level: VerificationLevel.CONFIRMED,
      },
    });
  }

  await upsertEdge({
    fromNodeId: nodeEntrance.id,
    toNodeId: nodeRampStart.id,
    connectionType: ConnectionType.RAMP,
    distanceMeters: 10.0,
    stepFree: true,
    slopePercent: 4.5,
    widthCm: 150,
    surface: "CONCRETE",
  });

  await upsertEdge({
    fromNodeId: nodeRampStart.id,
    toNodeId: nodeLobby0.id,
    connectionType: ConnectionType.CORRIDOR,
    distanceMeters: 10.0,
    stepFree: true,
    widthCm: 180,
    surface: "TILE",
  });

  await upsertEdge({
    fromNodeId: nodeLobby0.id,
    toNodeId: nodeStairs0.id,
    connectionType: ConnectionType.CORRIDOR,
    distanceMeters: 5.0,
    stepFree: true,
    widthCm: 180,
    surface: "TILE",
  });

  await upsertEdge({
    fromNodeId: nodeLobby0.id,
    toNodeId: nodeCorridor0.id,
    connectionType: ConnectionType.CORRIDOR,
    distanceMeters: 20.0,
    stepFree: true,
    widthCm: 200,
    surface: "TILE",
  });

  await upsertEdge({
    fromNodeId: nodeCorridor0.id,
    toNodeId: nodeRestroom0.id,
    connectionType: ConnectionType.DOOR,
    distanceMeters: 10.0,
    stepFree: true,
    widthCm: 95,
  });

  await upsertEdge({
    fromNodeId: nodeLobby0.id,
    toNodeId: nodeLobby1.id,
    connectionType: ConnectionType.ELEVATOR,
    distanceMeters: 4.0,
    stepFree: true,
    widthCm: 110,
  });

  await upsertEdge({
    fromNodeId: nodeLobby1.id,
    toNodeId: nodeLobby0.id,
    connectionType: ConnectionType.ELEVATOR,
    distanceMeters: 4.0,
    stepFree: true,
    widthCm: 110,
  });

  await upsertEdge({
    fromNodeId: nodeStairs0.id,
    toNodeId: nodeStairs1.id,
    connectionType: ConnectionType.STAIRS,
    distanceMeters: 6.0,
    stepFree: false,
    widthCm: 120,
  });

  await upsertEdge({
    fromNodeId: nodeStairs1.id,
    toNodeId: nodeStairs0.id,
    connectionType: ConnectionType.STAIRS,
    distanceMeters: 6.0,
    stepFree: false,
    widthCm: 120,
  });

  await upsertEdge({
    fromNodeId: nodeLobby1.id,
    toNodeId: nodeCorridor1.id,
    connectionType: ConnectionType.CORRIDOR,
    distanceMeters: 20.0,
    stepFree: true,
    widthCm: 200,
    surface: "TILE",
  });

  async function upsertFacility(params: {
    name: string;
    facilityType: FacilityType;
    operationalStatus: OperationalStatus;
    verificationLevel: VerificationLevel;
    lastVerifiedAt: Date | null;
    floorId?: string;
    nodeId?: string;
  }) {
    const existing = await client.facility.findFirst({
      where: {
        venue_id: venue!.id,
        name: params.name,
      },
    });

    if (existing) {
      return client.facility.update({
        where: { id: existing.id },
        data: {
          building_id: building!.id,
          floor_id: params.floorId ?? floor0.id,
          node_id: params.nodeId,
          facility_type: params.facilityType,
          operational_status: params.operationalStatus,
          verification_level: params.verificationLevel,
          last_verified_at: params.lastVerifiedAt,
        },
      });
    }

    return client.facility.create({
      data: {
        venue_id: venue!.id,
        building_id: building!.id,
        floor_id: params.floorId ?? floor0.id,
        node_id: params.nodeId,
        facility_type: params.facilityType,
        name: params.name,
        operational_status: params.operationalStatus,
        verification_level: params.verificationLevel,
        last_verified_at: params.lastVerifiedAt,
      },
    });
  }

  await upsertFacility({
    name: "Main Entrance (Step-Free)",
    facilityType: FacilityType.ENTRANCE,
    operationalStatus: OperationalStatus.OPERATIONAL,
    verificationLevel: VerificationLevel.CONFIRMED,
    lastVerifiedAt: new Date("2026-10-15T10:00:00Z"),
    nodeId: nodeEntrance.id,
  });

  await upsertFacility({
    name: "Central Building Lift A",
    facilityType: FacilityType.LIFT,
    operationalStatus: OperationalStatus.OPERATIONAL,
    verificationLevel: VerificationLevel.CONFIRMED,
    lastVerifiedAt: new Date("2026-11-01T08:30:00Z"),
    nodeId: nodeLobby0.id,
  });

  await upsertFacility({
    name: "Ground Entrance Access Ramp",
    facilityType: FacilityType.RAMP,
    operationalStatus: OperationalStatus.OPERATIONAL,
    verificationLevel: VerificationLevel.CONFIRMED,
    lastVerifiedAt: new Date("2026-09-20T14:15:00Z"),
    nodeId: nodeRampStart.id,
  });

  await upsertFacility({
    name: "Accessible Restroom (Ground Floor)",
    facilityType: FacilityType.ACCESSIBLE_RESTROOM,
    operationalStatus: OperationalStatus.OPERATIONAL,
    verificationLevel: VerificationLevel.UNVERIFIED,
    lastVerifiedAt: null,
    nodeId: nodeRestroom0.id,
  });

  await upsertFacility({
    name: "Welcome & Information Desk",
    facilityType: FacilityType.RECEPTION,
    operationalStatus: OperationalStatus.OPERATIONAL,
    verificationLevel: VerificationLevel.CONFIRMED,
    lastVerifiedAt: new Date("2026-10-05T09:00:00Z"),
  });

  await upsertFacility({
    name: "West Service Lift",
    facilityType: FacilityType.LIFT,
    operationalStatus: OperationalStatus.OUT_OF_SERVICE,
    verificationLevel: VerificationLevel.UNAVAILABLE,
    lastVerifiedAt: new Date("2026-11-05T12:00:00Z"),
  });

  await upsertFacility({
    name: "Campus Tactile Pathway",
    facilityType: FacilityType.TACTILE_PAVING,
    operationalStatus: OperationalStatus.OPERATIONAL,
    verificationLevel: VerificationLevel.UNVERIFIED,
    lastVerifiedAt: new Date("2026-11-06T16:00:00Z"),
  });
}

async function main() {
  try {
    await runSeed();
  } finally {
    await defaultPrisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
