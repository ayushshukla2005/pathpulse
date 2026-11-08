import { validateEnv } from "./env.validation";

describe("validateEnv", () => {
  const validConfig = {
    DATABASE_URL: "postgresql://pathpulse:pathpulse_dev_password@localhost:5432/pathpulse",
    WEB_ORIGIN: "http://localhost:3000",
    API_PORT: "4000",
    JWT_ACCESS_SECRET: "this-is-a-valid-access-secret-32-chars-long",
    JWT_REFRESH_SECRET: "this-is-a-valid-refresh-secret-32-chars-long",
    REDIS_URL: "redis://localhost:6379",
  };

  it("should pass when all environment variables are valid", () => {
    const result = validateEnv(validConfig);
    expect(result.DATABASE_URL).toBe(validConfig.DATABASE_URL);
    expect(result.API_PORT).toBe(4000);
    expect(result.JWT_ACCESS_SECRET).toBe(validConfig.JWT_ACCESS_SECRET);
    expect(result.S3_BUCKET).toBe("pathpulse-evidence");
    expect(result.S3_ENDPOINT).toBe("http://localhost:9000");
  });

  it("should pass when explicit S3 variables are provided", () => {
    const customConfig = {
      ...validConfig,
      S3_ENDPOINT: "https://s3.amazonaws.com",
      S3_REGION: "eu-west-1",
      S3_BUCKET: "my-custom-bucket",
      S3_ACCESS_KEY_ID: "custom_key",
      S3_SECRET_ACCESS_KEY: "custom_secret",
      S3_FORCE_PATH_STYLE: "false",
      S3_PRESIGNED_EXPIRY_SECONDS: "600",
    };
    const result = validateEnv(customConfig);
    expect(result.S3_BUCKET).toBe("my-custom-bucket");
    expect(result.S3_REGION).toBe("eu-west-1");
    expect(result.S3_FORCE_PATH_STYLE).toBe(false);
    expect(result.S3_PRESIGNED_EXPIRY_SECONDS).toBe(600);
  });

  it("should fail when a required variable is missing", () => {
    const invalidConfig = { ...validConfig };
    delete (invalidConfig as Record<string, unknown>).DATABASE_URL;

    expect(() => validateEnv(invalidConfig)).toThrow(/Environment validation failed/);
  });

  it("should fail when a secret is shorter than 32 characters", () => {
    const invalidConfig = {
      ...validConfig,
      JWT_ACCESS_SECRET: "too-short",
    };

    expect(() => validateEnv(invalidConfig)).toThrow(/Environment validation failed/);
  });

  it("should fail when a secret uses a known placeholder value", () => {
    const invalidConfig = {
      ...validConfig,
      JWT_ACCESS_SECRET: "your-super-secret-jwt-access-key-here",
    };

    expect(() => validateEnv(invalidConfig)).toThrow(
      /JWT_ACCESS_SECRET must not use a default placeholder value/,
    );
  });
});
