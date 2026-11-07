export interface AppConfig {
  databaseUrl: string;
  webOrigin: string;
  apiPort: number;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  redisUrl: string;
  routeCacheTtlSeconds: number;
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
});
