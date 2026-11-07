import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole, Venue } from "@prisma/client";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { OrganizationOwnershipGuard } from "../common/guards/organization-ownership.guard";
import { CreateVenueDto } from "./dto/create-venue.dto";
import { FindVenuesQueryDto } from "./dto/find-venues-query.dto";
import { VenuesService, VenueWithDistance } from "./venues.service";

@Controller()
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Public()
  @Get("venues")
  async findVenues(@Query() query: FindVenuesQueryDto): Promise<VenueWithDistance[]> {
    return this.venuesService.findVenues(query);
  }

  @Public()
  @Get("venues/:id")
  async getVenueById(@Param("id") id: string): Promise<Venue> {
    return this.venuesService.getVenueById(id);
  }

  @Roles(UserRole.ORGANIZATION_ADMIN)
  @UseGuards(OrganizationOwnershipGuard)
  @Post("organizations/:orgId/venues")
  async createVenue(@Param("orgId") orgId: string, @Body() dto: CreateVenueDto): Promise<Venue> {
    return this.venuesService.createVenue(orgId, dto);
  }
}
