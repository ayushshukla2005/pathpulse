import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateFloorDto {
  @IsInt({ message: "Floor number must be an integer" })
  floorNumber!: number;

  @IsString({ message: "Name must be a string" })
  @IsNotEmpty({ message: "Name is required" })
  name!: string;

  @IsOptional()
  @IsInt({ message: "Level index must be an integer" })
  levelIndex?: number = 0;
}
