import { Module } from "@nestjs/common";
import { AiScoringModule } from "../ai-scoring/ai-scoring.module";
import { DebtorsController } from "./debtors.controller";
import { DebtorsService } from "./debtors.service";

@Module({
  imports: [AiScoringModule],
  controllers: [DebtorsController],
  providers: [DebtorsService],
  exports: [DebtorsService]
})
export class DebtorsModule {}
