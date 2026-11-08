import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { OperationalStatus } from "@prisma/client";

export class GetFacilitiesQueryDto {
  @IsOptional()
  @IsString()
  buildingId?: string;

  @IsOptional()
  @IsEnum(OperationalStatus)
  status?: OperationalStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;
}
