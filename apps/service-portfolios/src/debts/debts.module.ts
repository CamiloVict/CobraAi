import { Module } from "@nestjs/common";
import { AiScoringModule } from "../ai-scoring/ai-scoring.module";
import { DebtorsModule } from "../debtors/debtors.module";
import { DebtsController } from "./debts.controller";
import { DebtsService } from "./debts.service";
import { PaymentEventsService } from "./payment-events.service";

@Module({
  imports: [DebtorsModule, AiScoringModule],
  controllers: [DebtsController],
  providers: [DebtsService, PaymentEventsService],
  exports: [DebtsService, PaymentEventsService]
})
export class DebtsModule {}
