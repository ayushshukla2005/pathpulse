import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
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
import { ReportsModule } from "./reports/reports.module";
import { UsersModule } from "./users/users.module";
import { VenuesModule } from "./venues/venues.module";

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    CacheModule,
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
