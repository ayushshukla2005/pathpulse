import { Module } from "@nestjs/common";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { StorageService } from "./storage.service";

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, StorageService],
  exports: [ReportsService, StorageService],
})
export class ReportsModule {}
