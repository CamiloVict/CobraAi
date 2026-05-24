import { Module } from "@nestjs/common";
import { GatewaysModule } from "../gateways/gateways.module";
import { KafkaModule } from "../kafka/kafka.module";
import { WebhookValidatorService } from "../webhooks/webhook-validator.service";
import { WebhooksService } from "../webhooks/webhooks.service";
import { PaymentConfirmationService } from "./payment-confirmation.service";
import {
  PaymentLinksController,
  PaymentsController
} from "./payments.controller";
import { PaymentLinksService, PaymentsService } from "./payments.service";

@Module({
  imports: [KafkaModule, GatewaysModule],
  controllers: [PaymentLinksController, PaymentsController],
  providers: [
    PaymentLinksService,
    PaymentsService,
    PaymentConfirmationService,
    WebhookValidatorService,
    WebhooksService
  ]
})
export class PaymentsModule {}
