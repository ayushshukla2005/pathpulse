import { Body, Controller, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { MapEdge, MapNode, UserRole } from "@prisma/client";
import { AuthenticatedUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { OrganizationOwnershipGuard } from "../common/guards/organization-ownership.guard";
import { CreateEdgeDto } from "./dto/create-edge.dto";
import { CreateNodeDto } from "./dto/create-node.dto";
import { UpdateEdgeDto } from "./dto/update-edge.dto";
import { NavigationService } from "./navigation.service";

@Controller()
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Roles(UserRole.ORGANIZATION_ADMIN)
  @UseGuards(OrganizationOwnershipGuard)
  @Post("buildings/:buildingId/nodes")
  async createNode(
    @Param("buildingId") buildingId: string,
    @Body() dto: CreateNodeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MapNode> {
    return this.navigationService.createNode(buildingId, dto, user.id);
  }

  @Roles(UserRole.ORGANIZATION_ADMIN)
  @UseGuards(OrganizationOwnershipGuard)
  @Post("buildings/:buildingId/edges")
  async createEdge(
    @Param("buildingId") buildingId: string,
    @Body() dto: CreateEdgeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MapEdge> {
    return this.navigationService.createEdge(buildingId, dto, user.id);
  }

  @Roles(UserRole.ORGANIZATION_ADMIN)
  @UseGuards(OrganizationOwnershipGuard)
  @Patch("edges/:edgeId")
  async updateEdge(
    @Param("edgeId") edgeId: string,
    @Body() dto: UpdateEdgeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MapEdge> {
    return this.navigationService.updateEdge(edgeId, dto, user.id);
  }
}
