import { Global, Module } from "@nestjs/common";
import { DebtsModule } from "../debts/debts.module";
import { KafkaConsumerService } from "./kafka.consumer";
import { KafkaService } from "./kafka.service";

@Global()
@Module({
  imports: [DebtsModule],
  providers: [KafkaService, KafkaConsumerService],
  exports: [KafkaService]
})
export class KafkaModule {}
