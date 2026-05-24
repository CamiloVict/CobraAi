import { Module } from "@nestjs/common";
import { PrismaService } from "@cobrai/db";
import { ClerkWebhookController } from "./clerk-webhook.controller";
import { ClerkWebhookService } from "./clerk-webhook.service";

@Module({
  controllers: [ClerkWebhookController],
  providers: [ClerkWebhookService, PrismaService]
})
export class WebhookModule {}
