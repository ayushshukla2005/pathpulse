import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export class CreateNodeDto {
  @IsUUID()
  @IsNotEmpty()
  floorId!: string;

  @IsString()
  @IsNotEmpty()
  nodeType!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber()
  @Min(0)
  xCoordinate!: number;

  @IsNumber()
  @Min(0)
  yCoordinate!: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isAccessible?: boolean;
}
