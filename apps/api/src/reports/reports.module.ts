import { Module } from "@nestjs/common";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { StorageService } from "./storage.service";
import { WorkflowModule } from "./workflow/workflow.module";

@Module({
  imports: [WorkflowModule],
  controllers: [ReportsController],
  providers: [ReportsService, StorageService],
  exports: [ReportsService, StorageService, WorkflowModule],
})
export class ReportsModule {}
