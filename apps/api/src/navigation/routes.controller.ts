import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { FindRouteDto } from "./dto/find-route.dto";
import { RouteResponse, RoutesService } from "./routes.service";

@Controller("routes")
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async findRoute(@Body() dto: FindRouteDto): Promise<RouteResponse> {
    const response = await this.routesService.findRoute(dto);

    if (response.status === "INVALID_INPUT") {
      throw new NotFoundException(response.reason);
    }

    if (response.status === "NO_CONFIRMED_ROUTE" || response.status === "UNREACHABLE") {
      throw new UnprocessableEntityException(response.reason);
    }

    return response;
  }
}
