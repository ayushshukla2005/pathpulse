import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";
import { PrismaService } from "../database/prisma.service";

@Controller("health")
export class HealthController {
  private readonly appVersion = "0.1.0";

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(@Res() res: Response): Promise<void> {
    const uptime = process.uptime();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      res.status(HttpStatus.OK).json({
        status: "ok",
        database: "connected",
        uptime,
        version: this.appVersion,
      });
    } catch {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: "degraded",
        database: "disconnected",
        uptime,
        version: this.appVersion,
      });
    }
  }
}
