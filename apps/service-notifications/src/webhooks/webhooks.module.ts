import { Module } from "@nestjs/common";
import { ComplianceModule } from "../compliance/compliance.module";
import { KafkaModule } from "../kafka/kafka.module";
import { AdaptersModule } from "../adapters/adapters.module";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";
import { TwilioWaWebhookHandler } from "./twilio-wa-webhook.handler";
import { VapiWebhookHandler } from "./vapi-webhook.handler";

@Module({
  imports: [ComplianceModule, KafkaModule, AdaptersModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, TwilioWaWebhookHandler, VapiWebhookHandler]
})
export class WebhooksModule {}
