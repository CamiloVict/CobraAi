import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TenantContextMiddleware } from "@cobrai/utils";
import { AiScoringModule } from "./ai-scoring/ai-scoring.module";
import { AuditModule } from "./audit/audit.module";
import { DebtsModule } from "./debts/debts.module";
import { DebtorsModule } from "./debtors/debtors.module";
import { HealthModule } from "./health/health.module";
import { ImportModule } from "./import/import.module";
import { KafkaModule } from "./kafka/kafka.module";
import { PortfoliosModule } from "./portfolios/portfolios.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    KafkaModule,
    AiScoringModule,
    AuditModule,
    HealthModule,
    PortfoliosModule,
    DebtsModule,
    DebtorsModule,
    ImportModule
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
