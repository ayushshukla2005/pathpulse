import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { BoundingBox, OverpassResponse } from "./types";

export interface OverpassClientOptions {
  apiUrl?: string;
  userAgent?: string;
  timeoutSeconds?: number;
  cacheDir?: string;
  useCache?: boolean;
}

export function parseBoundingBox(raw: string): BoundingBox {
  const parts = raw
    .trim()
    .split(/[\s,]+/)
    .map((p) => parseFloat(p));

  if (parts.length !== 4 || parts.some((p) => isNaN(p))) {
    throw new Error(`Invalid bounding box: "${raw}". Expected 4 numbers: south,west,north,east.`);
  }

  const [south, west, north, east] = parts as [number, number, number, number];

  if (south < -90 || south > 90 || north < -90 || north > 90) {
    throw new Error(
      `Bounding box latitude out of bounds (-90 to 90): south=${south}, north=${north}`,
    );
  }

  if (west < -180 || west > 180 || east < -180 || east > 180) {
    throw new Error(
      `Bounding box longitude out of bounds (-180 to 180): west=${west}, east=${east}`,
    );
  }

  if (south >= north) {
    throw new Error(`Bounding box south (${south}) must be less than north (${north})`);
  }

  if (west >= east) {
    throw new Error(`Bounding box west (${west}) must be less than east (${east})`);
  }

  const area = (north - south) * (east - west);
  if (area > 1.0) {
    throw new Error(
      `Bounding box too large (${area.toFixed(4)} sq deg). Maximum allowed area is 1.0 sq deg.`,
    );
  }

  return { south, west, north, east };
}

export function buildOverpassQuery(bbox: BoundingBox, timeoutSeconds = 60): string {
  const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  return `[out:json][timeout:${timeoutSeconds}];
(
  nwr["amenity"="hospital"](${bboxStr});
  nwr["amenity"="university"](${bboxStr});
  nwr["amenity"="college"](${bboxStr});
  nwr["public_transport"="station"](${bboxStr});
  nwr["railway"="station"](${bboxStr});
  nwr["shop"="mall"](${bboxStr});
  nwr["highway"="elevator"](${bboxStr});
  node["entrance"]["wheelchair"](${bboxStr});
  nwr["wheelchair"](${bboxStr});
);
out center tags;`;
}

export class OverpassClient {
  private readonly apiUrl: string;
  private readonly userAgent: string;
  private readonly timeoutSeconds: number;
  private readonly cacheDir: string;
  private readonly useCache: boolean;

  constructor(options: OverpassClientOptions = {}) {
    this.apiUrl =
      options.apiUrl || process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter";
    this.userAgent =
      options.userAgent ||
      process.env.OVERPASS_USER_AGENT ||
      "PathPulse-OSM-Importer/1.0 (https://pathpulse.local; contact@pathpulse.local)";
    this.timeoutSeconds = options.timeoutSeconds ?? 60;
    this.cacheDir = options.cacheDir || path.resolve(process.cwd(), ".osm-cache");
    this.useCache = options.useCache ?? true;
  }

  private getCachePath(query: string): string {
    const hash = crypto.createHash("sha256").update(query).digest("hex");
    return path.join(this.cacheDir, `${hash}.json`);
  }

  async fetch(query: string): Promise<OverpassResponse> {
    const cachePath = this.getCachePath(query);

    if (this.useCache && fs.existsSync(cachePath)) {
      try {
        const rawCached = fs.readFileSync(cachePath, "utf-8");
        const parsed = JSON.parse(rawCached) as OverpassResponse;
        if (parsed && Array.isArray(parsed.elements)) {
          return parsed;
        }
      } catch (err: unknown) {
        void err;
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), (this.timeoutSeconds + 10) * 1000);

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "User-Agent": this.userAgent,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Overpass API request failed with status ${response.status}: ${errorText.slice(0, 300)}`,
        );
      }

      const data = (await response.json()) as OverpassResponse;

      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), "utf-8");

      return data;
    } finally {
      clearTimeout(timer);
    }
  }
}
