import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { RedisService } from "../cache/redis.service";
import { Public } from "../common/decorators/public.decorator";
import { PrismaService } from "../database/prisma.service";

export function getLocalMigrationNames(): string[] {
  const candidateDirs = [
    path.resolve(process.cwd(), "prisma/migrations"),
    path.resolve(process.cwd(), "apps/api/prisma/migrations"),
    path.resolve(__dirname, "../../prisma/migrations"),
    path.resolve(__dirname, "../../../prisma/migrations"),
  ];

  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      return fs
        .readdirSync(dir)
        .filter((entry) => {
          const fullPath = path.join(dir, entry);
          return (
            fs.statSync(fullPath).isDirectory() &&
            fs.existsSync(path.join(fullPath, "migration.sql"))
          );
        })
        .sort();
    }
  }
  return [];
}

@Controller("health")
export class HealthController {
  private readonly appVersion = "0.1.0";

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Public()
  @Get()
  async check(@Res() res: Response): Promise<void> {
    const uptime = process.uptime();
    const isRedisHealthy = await this.redisService.isHealthy();
    const redisStatus = isRedisHealthy ? "ok" : "degraded";

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      res.status(HttpStatus.OK).json({
        status: "ok",
        database: "connected",
        redis: redisStatus,
        uptime,
        version: this.appVersion,
      });
    } catch {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: "degraded",
        database: "disconnected",
        redis: redisStatus,
        uptime,
        version: this.appVersion,
      });
    }
  }

  @Public()
  @Get("ready")
  async ready(@Res() res: Response): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: "not_ready",
        reason: "database_unreachable",
      });
      return;
    }

    const localMigrations = getLocalMigrationNames();
    if (localMigrations.length > 0) {
      try {
        const appliedRows = await this.prisma.$queryRaw<Array<{ migration_name: string }>>`
          SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
        `;
        const appliedSet = new Set(appliedRows.map((r) => r.migration_name));
        const pending = localMigrations.filter((m) => !appliedSet.has(m));

        if (pending.length > 0) {
          res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
            status: "not_ready",
            reason: "pending_migrations",
            pendingCount: pending.length,
          });
          return;
        }
      } catch {
        res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          status: "not_ready",
          reason: "pending_migrations",
        });
        return;
      }
    }

    res.status(HttpStatus.OK).json({
      status: "ready",
    });
  }
}
