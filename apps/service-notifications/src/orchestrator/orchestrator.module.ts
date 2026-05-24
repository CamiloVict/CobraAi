import { Module } from "@nestjs/common";
import { WaterfallService } from "./waterfall.service";

@Module({
  providers: [WaterfallService],
  exports: [WaterfallService]
})
export class OrchestratorModule {}
