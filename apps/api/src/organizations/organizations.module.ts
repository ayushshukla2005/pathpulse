import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { AnalyticsService } from "./analytics/analytics.service";
import { OrganizationsController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";

@Module({
  imports: [DatabaseModule],
  controllers: [OrganizationsController],
  providers: [AnalyticsService, OrganizationsService],
  exports: [AnalyticsService, OrganizationsService],
})
export class OrganizationsModule {}
