import * as fs from "fs";
import * as path from "path";
import { PrismaClient, VerificationLevel, OperationalStatus, DataSource } from "@prisma/client";
import {
  parseBoundingBox,
  buildOverpassQuery,
  extractOsmElements,
  OSM_ATTRIBUTION,
  OsmImporter,
  OverpassResponse,
} from "./index";

describe("OSM Import Pipeline", () => {
  let sampleFixture: OverpassResponse;

  beforeAll(() => {
    const fixturePath = path.resolve(__dirname, "../../../test/fixtures/osm-sample.json");
    const raw = fs.readFileSync(fixturePath, "utf-8");
    sampleFixture = JSON.parse(raw) as OverpassResponse;
  });

  describe("Bounding Box & Query Builder", () => {
    it("parses valid bounding box strings", () => {
      const bbox = parseBoundingBox("12.90,77.50,13.00,77.60");
      expect(bbox).toEqual({
        south: 12.9,
        west: 77.5,
        north: 13.0,
        east: 77.6,
      });
    });

    it("rejects invalid bounding box ranges", () => {
      expect(() => parseBoundingBox("13.00,77.50,12.90,77.60")).toThrow("must be less than north");
      expect(() => parseBoundingBox("12.90,77.60,13.00,77.50")).toThrow("must be less than east");
      expect(() => parseBoundingBox("10.0,70.0,20.0,80.0")).toThrow("too large");
    });

    it("constructs an Overpass QL query containing all required filters", () => {
      const query = buildOverpassQuery({ south: 12.9, west: 77.5, north: 13.0, east: 77.6 });
      expect(query).toContain('nwr["amenity"="hospital"]');
      expect(query).toContain('nwr["amenity"="university"]');
      expect(query).toContain('nwr["amenity"="college"]');
      expect(query).toContain('nwr["public_transport"="station"]');
      expect(query).toContain('nwr["railway"="station"]');
      expect(query).toContain('nwr["shop"="mall"]');
      expect(query).toContain('nwr["highway"="elevator"]');
      expect(query).toContain('node["entrance"]["wheelchair"]');
      expect(query).toContain('nwr["wheelchair"]');
    });
  });

  describe("OSM Element Mapping", () => {
    it("maps venues, buildings, and facilities accurately from the sample fixture", () => {
      const { venues, buildings, facilities } = extractOsmElements(sampleFixture.elements);

      expect(venues.length).toBeGreaterThanOrEqual(4);
      expect(facilities.length).toBeGreaterThanOrEqual(4);

      const hospital = venues.find((v) => v.name === "City Central Hospital");
      expect(hospital).toBeDefined();
      expect(hospital?.category).toBe("HEALTHCARE");
      expect(hospital?.source).toBe("OSM");
      expect(hospital?.sourceRef).toBe("node/1001");
      expect(hospital?.sourceLicense).toBe(OSM_ATTRIBUTION);

      const university = venues.find((v) => v.name === "Metropolitan University Campus");
      expect(university).toBeDefined();
      expect(university?.category).toBe("EDUCATION");

      const mall = venues.find((v) => v.name === "Grand Metro Mall");
      expect(mall).toBeDefined();
      expect(mall?.category).toBe("SHOPPING");

      const station = venues.find((v) => v.name === "Central Metro Station");
      expect(station).toBeDefined();
      expect(station?.category).toBe("TRANSIT");

      expect(buildings.length).toBeGreaterThanOrEqual(1);
    });

    it("ensures facilities start as UNVERIFIED and UNKNOWN, never CONFIRMED or OPERATIONAL", () => {
      const { facilities } = extractOsmElements(sampleFixture.elements);

      for (const facility of facilities) {
        expect(facility.verificationLevel).toBe("UNVERIFIED");
        expect(facility.operationalStatus).toBe("UNKNOWN");
        expect(facility.verificationLevel).not.toBe("CONFIRMED");
        expect(facility.operationalStatus).not.toBe("OPERATIONAL");
      }
    });

    it("stores wheelchair accessibility information in notes only", () => {
      const { facilities } = extractOsmElements(sampleFixture.elements);

      const wheelchairFacilities = facilities.filter(
        (f) => f.notes && f.notes.includes("wheelchair="),
      );
      expect(wheelchairFacilities.length).toBeGreaterThanOrEqual(1);

      for (const f of wheelchairFacilities) {
        expect(f.notes).toMatch(/wheelchair=(yes|limited|no)/);
        expect(f.verificationLevel).toBe("UNVERIFIED");
      }
    });

    it("attaches the ODbL license string to every mapped element", () => {
      const { venues, buildings, facilities } = extractOsmElements(sampleFixture.elements);

      for (const v of venues) {
        expect(v.sourceLicense).toBe(OSM_ATTRIBUTION);
      }
      for (const b of buildings) {
        expect(b.sourceLicense).toBe(OSM_ATTRIBUTION);
      }
      for (const f of facilities) {
        expect(f.sourceLicense).toBe(OSM_ATTRIBUTION);
      }
    });
  });

  describe("Idempotent Database Import", () => {
    const prisma = new PrismaClient();

    beforeAll(async () => {
      await prisma.$connect();
      await prisma.facility.deleteMany({
        where: { source: DataSource.OSM },
      });
      await prisma.building.deleteMany({
        where: { source: DataSource.OSM },
      });
      await prisma.venue.deleteMany({
        where: { source: DataSource.OSM },
      });
    });

    afterAll(async () => {
      await prisma.facility.deleteMany({
        where: { source: DataSource.OSM },
      });
      await prisma.building.deleteMany({
        where: { source: DataSource.OSM },
      });
      await prisma.venue.deleteMany({
        where: { source: DataSource.OSM },
      });
      await prisma.$disconnect();
    });

    it("produces identical counts and updates existing rows when run multiple times", async () => {
      const importer = new OsmImporter(prisma);

      const firstRun = await importer.importOverpassData(sampleFixture);
      expect(firstRun.venuesCreated).toBeGreaterThan(0);
      expect(firstRun.facilitiesCreated).toBeGreaterThan(0);

      const countVenuesFirst = await prisma.venue.count({
        where: { source: DataSource.OSM },
      });
      const countFacilitiesFirst = await prisma.facility.count({
        where: { source: DataSource.OSM },
      });

      const secondRun = await importer.importOverpassData(sampleFixture);
      expect(secondRun.venuesCreated).toBe(0);
      expect(secondRun.facilitiesCreated).toBe(0);
      expect(secondRun.venuesUpdated).toBe(firstRun.venuesProcessed);
      expect(secondRun.facilitiesUpdated).toBe(firstRun.facilitiesProcessed);

      const countVenuesSecond = await prisma.venue.count({
        where: { source: DataSource.OSM },
      });
      const countFacilitiesSecond = await prisma.facility.count({
        where: { source: DataSource.OSM },
      });

      expect(countVenuesSecond).toBe(countVenuesFirst);
      expect(countFacilitiesSecond).toBe(countFacilitiesFirst);

      const importedFacilities = await prisma.facility.findMany({
        where: { source: DataSource.OSM },
      });
      for (const f of importedFacilities) {
        expect(f.verification_level).toBe(VerificationLevel.UNVERIFIED);
        expect(f.operational_status).toBe(OperationalStatus.UNKNOWN);
        expect(f.sourceLicense).toBe(OSM_ATTRIBUTION);
      }
    });
  });
});
