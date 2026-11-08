import { plainToInstance } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from "class-validator";

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

  @IsOptional()
  @IsNumber()
  ROUTE_CACHE_TTL_SECONDS: number = 900;

  @IsString()
  @IsNotEmpty()
  S3_ENDPOINT: string = "http://localhost:9000";

  @IsString()
  @IsNotEmpty()
  S3_REGION: string = "us-east-1";

  @IsString()
  @IsNotEmpty()
  S3_BUCKET: string = "pathpulse-evidence";

  @IsString()
  @IsNotEmpty()
  S3_ACCESS_KEY_ID: string = "pathpulse_admin";

  @IsString()
  @IsNotEmpty()
  S3_SECRET_ACCESS_KEY: string = "pathpulse_secret_key";

  @IsOptional()
  @IsBoolean()
  S3_FORCE_PATH_STYLE: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(1)
  S3_PRESIGNED_EXPIRY_SECONDS: number = 900;

  @IsOptional()
  @IsNumber()
  @Min(1)
  WS_SUBSCRIPTION_RATE_LIMIT: number = 10;

  @IsOptional()
  @IsString()
  AI_SERVICE_URL: string = "http://localhost:8000";

  @IsOptional()
  @IsString()
  AI_SERVICE_TOKEN: string = "dev-pathpulse-ai-internal-service-token-secret";

  @IsOptional()
  @IsNumber()
  @Min(100)
  AI_TIMEOUT_MS: number = 2000;

  @IsOptional()
  @IsNumber()
  @Min(1)
  AI_BREAKER_FAILURE_THRESHOLD: number = 3;

  @IsOptional()
  @IsNumber()
  @Min(100)
  AI_BREAKER_RESET_TIMEOUT_MS: number = 10000;

  @IsOptional()
  @IsNumber()
  @Min(1)
  AI_BREAKER_HALF_OPEN_SUCCESS_THRESHOLD: number = 1;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, {
    ...config,
    API_PORT: config.API_PORT !== undefined ? Number(config.API_PORT) : 4000,
    ROUTE_CACHE_TTL_SECONDS:
      config.ROUTE_CACHE_TTL_SECONDS !== undefined ? Number(config.ROUTE_CACHE_TTL_SECONDS) : 900,
    S3_ENDPOINT:
      config.S3_ENDPOINT !== undefined ? String(config.S3_ENDPOINT) : "http://localhost:9000",
    S3_REGION: config.S3_REGION !== undefined ? String(config.S3_REGION) : "us-east-1",
    S3_BUCKET: config.S3_BUCKET !== undefined ? String(config.S3_BUCKET) : "pathpulse-evidence",
    S3_ACCESS_KEY_ID:
      config.S3_ACCESS_KEY_ID !== undefined ? String(config.S3_ACCESS_KEY_ID) : "pathpulse_admin",
    S3_SECRET_ACCESS_KEY:
      config.S3_SECRET_ACCESS_KEY !== undefined
        ? String(config.S3_SECRET_ACCESS_KEY)
        : "pathpulse_secret_key",
    S3_FORCE_PATH_STYLE:
      config.S3_FORCE_PATH_STYLE !== undefined
        ? String(config.S3_FORCE_PATH_STYLE) !== "false"
        : true,
    S3_PRESIGNED_EXPIRY_SECONDS:
      config.S3_PRESIGNED_EXPIRY_SECONDS !== undefined
        ? Number(config.S3_PRESIGNED_EXPIRY_SECONDS)
        : 900,
    WS_SUBSCRIPTION_RATE_LIMIT:
      config.WS_SUBSCRIPTION_RATE_LIMIT !== undefined
        ? Number(config.WS_SUBSCRIPTION_RATE_LIMIT)
        : 10,
    AI_SERVICE_URL:
      config.AI_SERVICE_URL !== undefined ? String(config.AI_SERVICE_URL) : "http://localhost:8000",
    AI_SERVICE_TOKEN:
      config.AI_SERVICE_TOKEN !== undefined
        ? String(config.AI_SERVICE_TOKEN)
        : "dev-pathpulse-ai-internal-service-token-secret",
    AI_TIMEOUT_MS: config.AI_TIMEOUT_MS !== undefined ? Number(config.AI_TIMEOUT_MS) : 2000,
    AI_BREAKER_FAILURE_THRESHOLD:
      config.AI_BREAKER_FAILURE_THRESHOLD !== undefined
        ? Number(config.AI_BREAKER_FAILURE_THRESHOLD)
        : 3,
    AI_BREAKER_RESET_TIMEOUT_MS:
      config.AI_BREAKER_RESET_TIMEOUT_MS !== undefined
        ? Number(config.AI_BREAKER_RESET_TIMEOUT_MS)
        : 10000,
    AI_BREAKER_HALF_OPEN_SUCCESS_THRESHOLD:
      config.AI_BREAKER_HALF_OPEN_SUCCESS_THRESHOLD !== undefined
        ? Number(config.AI_BREAKER_HALF_OPEN_SUCCESS_THRESHOLD)
        : 1,
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
