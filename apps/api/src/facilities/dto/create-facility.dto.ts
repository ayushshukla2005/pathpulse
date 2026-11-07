import { FacilityType, OperationalStatus, VerificationLevel } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateFacilityDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(FacilityType)
  @IsNotEmpty()
  facilityType!: FacilityType;

  @IsOptional()
  @IsUUID()
  floorId?: string;

  @IsOptional()
  @IsUUID()
  nodeId?: string;

  @IsOptional()
  @IsEnum(OperationalStatus)
  operationalStatus?: OperationalStatus;

  @IsOptional()
  @IsEnum(VerificationLevel)
  verificationLevel?: VerificationLevel;
}
