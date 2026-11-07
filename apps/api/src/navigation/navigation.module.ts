import { Module } from "@nestjs/common";
import { GraphLoaderService } from "./graph/graph-loader.service";
import { NavigationController } from "./navigation.controller";
import { NavigationService } from "./navigation.service";
import { RoutesController } from "./routes.controller";
import { RoutesService } from "./routes.service";

@Module({
  controllers: [NavigationController, RoutesController],
  providers: [NavigationService, GraphLoaderService, RoutesService],
  exports: [NavigationService, GraphLoaderService, RoutesService],
})
export class NavigationModule {}
