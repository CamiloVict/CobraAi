import { Module, forwardRef } from "@nestjs/common";
import { KafkaConsumerService } from "./kafka.consumer";
import { KafkaService } from "./kafka.service";
import { WorkflowsModule } from "../workflows/workflows.module";

@Module({
  imports: [forwardRef(() => WorkflowsModule)],
  providers: [KafkaService, KafkaConsumerService],
  exports: [KafkaService]
})
export class KafkaModule {}
