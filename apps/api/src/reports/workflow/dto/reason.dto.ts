import { IsNotEmpty, IsString } from "class-validator";

export class ReasonDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
