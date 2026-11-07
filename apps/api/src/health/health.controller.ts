import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";
import { RedisService } from "../cache/redis.service";
import { Public } from "../common/decorators/public.decorator";
import { PrismaService } from "../database/prisma.service";

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
}
