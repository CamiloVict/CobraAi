import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bufferLogs: true
  });

  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(",") ?? [
      "http://localhost:3001",
      "http://localhost:3000"
    ],
    credentials: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true
    })
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  Logger.log(
    `CobraAI API Gateway en http://localhost:${port} (Clerk auth)`,
    "Bootstrap"
  );
}

void bootstrap();
