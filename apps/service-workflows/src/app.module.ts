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
import { PrismaModule } from "./prisma/prisma.module";
import { SchedulerModule } from "./scheduler/scheduler.module";
import { WorkflowsModule } from "./workflows/workflows.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    KafkaModule,
    WorkflowsModule,
    SchedulerModule,
    HealthModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantContextMiddleware)
      .exclude({ path: "health", method: RequestMethod.GET })
      .forRoutes("*");
  }
}
