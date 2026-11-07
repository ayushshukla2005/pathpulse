import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class FindVenuesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Latitude must be a valid number" })
  @Min(-90, { message: "Latitude must be between -90 and 90" })
  @Max(90, { message: "Latitude must be between -90 and 90" })
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Longitude must be a valid number" })
  @Min(-180, { message: "Longitude must be between -180 and 180" })
  @Max(180, { message: "Longitude must be between -180 and 180" })
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "radiusMeters must be a valid number" })
  @Min(1, { message: "radiusMeters must be between 1 and 10000" })
  @Max(10000, { message: "radiusMeters must be between 1 and 10000" })
  radiusMeters?: number = 1000;

  @IsOptional()
  @IsString({ message: "Category must be a string" })
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Limit must be an integer" })
  @Min(1, { message: "Limit must be at least 1" })
  @Max(100, { message: "Limit cannot exceed 100" })
  limit?: number = 20;
}
