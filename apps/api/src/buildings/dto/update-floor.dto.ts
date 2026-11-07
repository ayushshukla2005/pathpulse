import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateFloorDto {
  @IsOptional()
  @IsInt({ message: "Floor number must be an integer" })
  floorNumber?: number;

  @IsOptional()
  @IsString({ message: "Name must be a string" })
  name?: string;
}
