import { Module } from "@nestjs/common";
import { AiModule } from "../../ai/ai.module";
import { NotificationsModule } from "../../notifications/notifications.module";
import { WorkflowController } from "./workflow.controller";
import { WorkflowService } from "./workflow.service";

@Module({
  imports: [NotificationsModule, AiModule],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
