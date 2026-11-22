import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { FacilitiesModule } from "../facilities/facilities.module";
import { CacheModule } from "../cache/cache.module";
import { ApiKeyService } from "./api-key.service";
import { ApiKeyAuthGuard } from "./guards/api-key-auth.guard";
import { OperatorFacilitiesController } from "./operator-facilities.controller";

@Module({
  imports: [DatabaseModule, FacilitiesModule, CacheModule],
  controllers: [OperatorFacilitiesController],
  providers: [ApiKeyService, ApiKeyAuthGuard],
  exports: [ApiKeyService, ApiKeyAuthGuard],
})
export class OperatorModule {}
