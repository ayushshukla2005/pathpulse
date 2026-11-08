import { IsIn, IsInt, Max, Min } from "class-validator";

export class CreateEvidenceDto {
  @IsIn(["image/jpeg", "image/png", "image/webp"])
  contentType!: "image/jpeg" | "image/png" | "image/webp";

  @IsInt()
  @Min(1024)
  @Max(5 * 1024 * 1024)
  sizeBytes!: number;
}
