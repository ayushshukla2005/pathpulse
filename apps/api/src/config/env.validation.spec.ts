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
