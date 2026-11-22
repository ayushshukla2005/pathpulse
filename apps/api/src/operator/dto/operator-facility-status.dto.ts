import { OperationalStatus } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class OperatorFacilityStatusDto {
  @IsOptional()
  @IsEnum(OperationalStatus)
  operationalStatus?: OperationalStatus;

  @IsOptional()
  @IsEnum(OperationalStatus)
  status?: OperationalStatus;

  @IsOptional()
  verificationLevel?: unknown;
}
