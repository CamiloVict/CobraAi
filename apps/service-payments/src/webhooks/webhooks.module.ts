import { Module } from "@nestjs/common";
import { WebhookValidatorService } from "./webhook-validator.service";
import { WebhooksService } from "./webhooks.service";

@Module({
  providers: [WebhookValidatorService, WebhooksService],
  exports: [WebhooksService, WebhookValidatorService]
})
export class WebhooksModule {}
