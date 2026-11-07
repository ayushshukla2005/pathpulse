import { OperationalStatus, VerificationLevel } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateFacilityStatusDto {
  @IsEnum(OperationalStatus)
  @IsNotEmpty()
  status!: OperationalStatus;

  @IsOptional()
  @IsEnum(VerificationLevel)
  verificationLevel?: VerificationLevel;
}
