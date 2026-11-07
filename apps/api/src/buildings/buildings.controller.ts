import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Building, Floor, UserRole } from "@prisma/client";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { OrganizationOwnershipGuard } from "../common/guards/organization-ownership.guard";
import { BuildingNavigationGraph, BuildingsService } from "./buildings.service";
import { CreateBuildingDto } from "./dto/create-building.dto";
import { CreateFloorDto } from "./dto/create-floor.dto";
import { UpdateFloorDto } from "./dto/update-floor.dto";

@Controller()
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Public()
  @Get("buildings/:id/floors")
  async getFloors(@Param("id") id: string): Promise<Floor[]> {
    return this.buildingsService.getFloors(id);
  }

  @Public()
  @Get("buildings/:id/map")
  async getBuildingMap(@Param("id") id: string): Promise<BuildingNavigationGraph> {
    return this.buildingsService.getBuildingMap(id);
  }

  @Roles(UserRole.ORGANIZATION_ADMIN)
  @UseGuards(OrganizationOwnershipGuard)
  @Post("venues/:venueId/buildings")
  async createBuilding(
    @Param("venueId") venueId: string,
    @Body() dto: CreateBuildingDto,
  ): Promise<Building> {
    return this.buildingsService.createBuilding(venueId, dto);
  }

  @Roles(UserRole.ORGANIZATION_ADMIN)
  @UseGuards(OrganizationOwnershipGuard)
  @Post("buildings/:buildingId/floors")
  async createFloor(
    @Param("buildingId") buildingId: string,
    @Body() dto: CreateFloorDto,
  ): Promise<Floor> {
    return this.buildingsService.createFloor(buildingId, dto);
  }

  @Roles(UserRole.ORGANIZATION_ADMIN)
  @UseGuards(OrganizationOwnershipGuard)
  @Put("buildings/:buildingId/floors/:floorId")
  async updateFloor(
    @Param("buildingId") buildingId: string,
    @Param("floorId") floorId: string,
    @Body() dto: UpdateFloorDto,
  ): Promise<Floor> {
    return this.buildingsService.updateFloor(buildingId, floorId, dto);
  }
}
