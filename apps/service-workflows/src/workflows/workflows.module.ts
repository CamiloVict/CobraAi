import { Module, forwardRef } from "@nestjs/common";
import { WorkflowsController } from "./workflows.controller";
import { WorkflowsService } from "./workflows.service";
import { RuleEngineService } from "../rule-engine/rule-engine.service";
import { KafkaModule } from "../kafka/kafka.module";
import { ComplianceModule } from "../compliance/compliance.module";

@Module({
  imports: [forwardRef(() => KafkaModule), ComplianceModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, RuleEngineService],
  exports: [WorkflowsService]
})
export class WorkflowsModule {}
