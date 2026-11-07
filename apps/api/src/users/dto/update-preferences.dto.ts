import { MobilityProfile } from "@prisma/client";
import { IsBoolean, IsEnum, IsNumber, IsOptional, Max, Min } from "class-validator";

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(MobilityProfile, { message: "Invalid mobility profile" })
  mobilityProfile?: MobilityProfile;

  @IsOptional()
  @IsBoolean()
  avoidStairs?: boolean;

  @IsOptional()
  @IsBoolean()
  preferVoiceGuidance?: boolean;

  @IsOptional()
  @IsBoolean()
  highContrast?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1.0, { message: "textScale must be at least 1.0" })
  @Max(2.0, { message: "textScale cannot exceed 2.0" })
  textScale?: number;
}
