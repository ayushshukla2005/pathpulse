import { ConnectionType, OperationalStatus } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

export class CreateEdgeDto {
  @IsUUID()
  @IsNotEmpty()
  fromNodeId!: string;

  @IsUUID()
  @IsNotEmpty()
  toNodeId!: string;

  @IsEnum(ConnectionType)
  @IsNotEmpty()
  connectionType!: ConnectionType;

  @IsNumber()
  @Min(0)
  distanceMeters!: number;

  @IsOptional()
  @IsBoolean()
  stepFree?: boolean;

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

  @IsOptional()
  @IsEnum(OperationalStatus)
  operationalStatus?: OperationalStatus;
}
