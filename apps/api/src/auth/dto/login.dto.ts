import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: "Invalid email address format" })
  @IsNotEmpty({ message: "Email is required" })
  email!: string;

  @IsString({ message: "Password is required" })
  @IsNotEmpty({ message: "Password cannot be empty" })
  password!: string;
}
