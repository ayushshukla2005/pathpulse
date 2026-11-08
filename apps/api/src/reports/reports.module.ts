import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { StorageService } from "./storage.service";
import { WorkflowModule } from "./workflow/workflow.module";

@Module({
  imports: [
    WorkflowModule,
    AiModule,
    BullModule.registerQueue({
      name: "report-ai-processing",
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, StorageService],
  exports: [ReportsService, StorageService, WorkflowModule],
})
export class ReportsModule {}
