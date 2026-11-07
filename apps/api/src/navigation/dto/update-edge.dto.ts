import { OperationalStatus } from "@prisma/client";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateEdgeDto {
  @IsOptional()
  @IsBoolean()
  stepFree?: boolean;

  @IsOptional()
  @IsEnum(OperationalStatus)
  operationalStatus?: OperationalStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  widthCm?: number;

  @IsOptional()
  @IsNumber()
  slopePercent?: number;

  @IsOptional()
  @IsString()
  surface?: string;
}
