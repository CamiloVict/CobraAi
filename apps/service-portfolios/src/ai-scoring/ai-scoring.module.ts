import { Module } from "@nestjs/common";
import { AI_SCORING_PORT, StubAIScoringAdapter } from "./stub-ai-scoring.adapter";
import { ScoringService } from "./scoring.service";

@Module({
  providers: [
    ScoringService,
    StubAIScoringAdapter,
    { provide: AI_SCORING_PORT, useExisting: StubAIScoringAdapter }
  ],
  exports: [ScoringService]
})
export class AiScoringModule {}
