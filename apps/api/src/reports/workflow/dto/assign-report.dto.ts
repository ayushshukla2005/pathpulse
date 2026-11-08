import { IsNotEmpty, IsString } from "class-validator";

export class AssignReportDto {
  @IsString()
  @IsNotEmpty()
  assignedToUserId!: string;
}
