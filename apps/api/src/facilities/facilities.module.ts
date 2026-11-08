import { Module } from "@nestjs/common";
import { RealtimeModule } from "../realtime/realtime.module";
import { FacilitiesController } from "./facilities.controller";
import { FacilitiesService } from "./facilities.service";

@Module({
  imports: [RealtimeModule],
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
  exports: [FacilitiesService],
})
export class FacilitiesModule {}
