import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateBuildingDto {
  @IsString({ message: "Name must be a string" })
  @IsNotEmpty({ message: "Name is required" })
  name!: string;

  @IsOptional()
  @IsString({ message: "Building code must be a string" })
  buildingCode?: string;
}
