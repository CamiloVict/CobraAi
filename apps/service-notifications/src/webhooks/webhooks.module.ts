import { Module } from "@nestjs/common";
import { AdaptersModule } from "../adapters/adapters.module";
import { ComplianceModule } from "../compliance/compliance.module";
import { KafkaModule } from "../kafka/kafka.module";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";
import { TwilioWaWebhookHandler } from "./twilio-wa-webhook.handler";
import { VapiWebhookHandler } from "./vapi-webhook.handler";

@Module({
  imports: [AdaptersModule, ComplianceModule, KafkaModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, TwilioWaWebhookHandler, VapiWebhookHandler]
})
export class WebhooksModule {}
