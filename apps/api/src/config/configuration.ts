export interface AppConfig {
  databaseUrl: string;
  webOrigin: string;
  apiPort: number;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  redisUrl: string;
  routeCacheTtlSeconds: number;
  s3Endpoint: string;
  s3Region: string;
  s3Bucket: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  s3ForcePathStyle: boolean;
  s3PresignedExpirySeconds: number;
}

export default (): AppConfig => ({
  databaseUrl: process.env.DATABASE_URL as string,
  webOrigin: process.env.WEB_ORIGIN as string,
  apiPort: process.env.API_PORT ? parseInt(process.env.API_PORT, 10) : 4000,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  redisUrl: process.env.REDIS_URL as string,
  routeCacheTtlSeconds: process.env.ROUTE_CACHE_TTL_SECONDS
    ? parseInt(process.env.ROUTE_CACHE_TTL_SECONDS, 10)
    : 900,
  s3Endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  s3Region: process.env.S3_REGION || "us-east-1",
  s3Bucket: process.env.S3_BUCKET || "pathpulse-evidence",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || "pathpulse_admin",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "pathpulse_secret_key",
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  s3PresignedExpirySeconds: process.env.S3_PRESIGNED_EXPIRY_SECONDS
    ? parseInt(process.env.S3_PRESIGNED_EXPIRY_SECONDS, 10)
    : 900,
});
