import { plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, Min, MinLength, validateSync } from "class-validator";

const PLACEHOLDER_SECRETS = [
  "your-super-secret-jwt-access-key-here",
  "your-super-secret-jwt-refresh-key-here",
  "placeholder",
  "change_me",
  "replace_me",
  "pathpulse_jwt_access_secret_change_me",
  "pathpulse_jwt_refresh_secret_change_me",
];

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  WEB_ORIGIN!: string;

  @IsNumber()
  @Min(1)
  API_PORT: number = 4000;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, {
    ...config,
    API_PORT: config.API_PORT !== undefined ? Number(config.API_PORT) : 4000,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  const validationErrors: string[] = [];

  if (errors.length > 0) {
    for (const err of errors) {
      if (err.constraints) {
        validationErrors.push(...Object.values(err.constraints));
      }
    }
  }

  const accessSecret = String(config.JWT_ACCESS_SECRET ?? "");
  const refreshSecret = String(config.JWT_REFRESH_SECRET ?? "");

  if (PLACEHOLDER_SECRETS.includes(accessSecret)) {
    validationErrors.push("JWT_ACCESS_SECRET must not use a default placeholder value");
  }

  if (PLACEHOLDER_SECRETS.includes(refreshSecret)) {
    validationErrors.push("JWT_REFRESH_SECRET must not use a default placeholder value");
  }

  if (validationErrors.length > 0) {
    throw new Error(`Environment validation failed:\n - ${validationErrors.join("\n - ")}`);
  }

  return validatedConfig;
}
