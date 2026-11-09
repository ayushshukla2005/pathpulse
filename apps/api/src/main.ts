import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { initSentry } from "./common/sentry/sentry.init";

async function bootstrap(): Promise<void> {
  initSentry();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix("api/v1");
  app.use(helmet());

  const webOrigin = configService.get<string>("webOrigin");
  if (webOrigin) {
    app.enableCors({
      origin: webOrigin,
      credentials: true,
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableShutdownHooks();

  const port = configService.get<number>("apiPort") ?? 4000;
  await app.listen(port);
}

bootstrap();
