import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TenantContextMiddleware } from "@cobrai/utils";
import { HealthModule } from "./health/health.module";
import { KafkaModule } from "./kafka/kafka.module";
import { PaymentsModule } from "./payments/payments.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    KafkaModule,
    PaymentsModule,
    HealthModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantContextMiddleware)
      .exclude(
        { path: "health", method: RequestMethod.GET },
        { path: "v1/payment-links/:token", method: RequestMethod.GET },
        { path: "v1/payments/checkout/:token", method: RequestMethod.POST },
        { path: "v1/payments/webhook/(.*)", method: RequestMethod.ALL },
        { path: "v1/payments/sandbox/:token/confirm", method: RequestMethod.POST }
      )
      .forRoutes("*");
  }
}
