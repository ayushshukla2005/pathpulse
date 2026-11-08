import { ReportCategory } from "@prisma/client";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateReportDto {
  @IsEnum(ReportCategory)
  category!: ReportCategory;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description!: string;

  @IsOptional()
  @IsString()
  venueId?: string;

  @IsOptional()
  @IsString()
  facilityId?: string;

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
}
