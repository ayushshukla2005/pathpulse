import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { OverpassClient, parseBoundingBox, buildOverpassQuery } from "./overpass-client";
import { OsmImporter } from "./osm-importer";
import { OverpassResponse } from "./types";

export async function runOsmImportCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  const prisma = new PrismaClient();

  try {
    let bboxArg: string | null = null;
    let fileArg: string | null = null;
    let noCache = false;

    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (!arg) continue;
      if (arg.startsWith("--bbox=")) {
        bboxArg = arg.slice(7);
      } else if (arg === "--bbox" && i + 1 < argv.length) {
        bboxArg = argv[++i] ?? null;
      } else if (arg.startsWith("--file=")) {
        fileArg = arg.slice(7);
      } else if (arg === "--file" && i + 1 < argv.length) {
        fileArg = argv[++i] ?? null;
      } else if (arg === "--no-cache") {
        noCache = true;
      }
    }

    if (!bboxArg && !fileArg) {
      bboxArg = process.env.OSM_BBOX || null;
    }

    let overpassData: OverpassResponse;

    if (fileArg) {
      const resolvedPath = path.resolve(process.cwd(), fileArg);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Input file not found: ${resolvedPath}`);
      }
      const rawContent = fs.readFileSync(resolvedPath, "utf-8");
      overpassData = JSON.parse(rawContent) as OverpassResponse;
    } else if (bboxArg) {
      const bbox = parseBoundingBox(bboxArg);
      const client = new OverpassClient({ useCache: !noCache });
      const query = buildOverpassQuery(bbox);
      overpassData = await client.fetch(query);
    } else {
      throw new Error(
        "Please specify a bounding box with --bbox=south,west,north,east or OSM_BBOX env variable, or specify a file with --file=path.json",
      );
    }

    const importer = new OsmImporter(prisma);
    const result = await importer.importOverpassData(overpassData);

    process.stdout.write(
      `OSM Import Completed Successfully:\n` +
        `- Venues: ${result.venuesProcessed} (Created: ${result.venuesCreated}, Updated: ${result.venuesUpdated})\n` +
        `- Buildings: ${result.buildingsProcessed}\n` +
        `- Facilities: ${result.facilitiesProcessed} (Created: ${result.facilitiesCreated}, Updated: ${result.facilitiesUpdated})\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runOsmImportCli().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`OSM Import Error: ${message}\n`);
    process.exit(1);
  });
}
