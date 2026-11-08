import { BullModule } from "@nestjs/bullmq";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { BuildingsModule } from "./buildings/buildings.module";
import { CacheModule } from "./cache/cache.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { UserThrottlerGuard } from "./common/guards/user-throttler.guard";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { AppConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { FacilitiesModule } from "./facilities/facilities.module";
import { HealthModule } from "./health/health.module";
import { NavigationModule } from "./navigation/navigation.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { AiModule } from "./ai/ai.module";
import { ReportsModule } from "./reports/reports.module";
import { UsersModule } from "./users/users.module";
import { VenuesModule } from "./venues/venues.module";

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    CacheModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>("redisUrl") || "redis://localhost:6379";
        try {
          const parsed = new URL(redisUrl);
          return {
            connection: {
              host: parsed.hostname || "localhost",
              port: parsed.port ? parseInt(parsed.port, 10) : 6379,
              password: parsed.password || undefined,
              username: parsed.username || undefined,
              db:
                parsed.pathname && parsed.pathname.length > 1
                  ? parseInt(parsed.pathname.slice(1), 10)
                  : 0,
              maxRetriesPerRequest: null,
              enableOfflineQueue: false,
              lazyConnect: true,
              retryStrategy: () => null,
            },
          };
        } catch {
          return {
            connection: {
              host: "localhost",
              port: 6379,
              maxRetriesPerRequest: null,
              enableOfflineQueue: false,
              lazyConnect: true,
              retryStrategy: () => null,
            },
          };
        }
      },
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    UsersModule,
    HealthModule,
    VenuesModule,
    BuildingsModule,
    NavigationModule,
    FacilitiesModule,
    ReportsModule,
    NotificationsModule,
    OrganizationsModule,
    RealtimeModule,
    AiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
