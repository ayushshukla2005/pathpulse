import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateFeedbackDto {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  honeypot?: string;
}
