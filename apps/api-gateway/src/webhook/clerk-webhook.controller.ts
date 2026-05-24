import {
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { Webhook } from "svix";
import { Public } from "../common/decorators/public.decorator";
import {
  ClerkWebhookService,
  type ClerkWebhookEvent
} from "./clerk-webhook.service";

@Controller("api/v1/webhooks/clerk")
export class ClerkWebhookController {
  constructor(
    private readonly webhookService: ClerkWebhookService,
    private readonly config: ConfigService
  ) {}

  @Public()
  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("svix-id") svixId: string,
    @Headers("svix-timestamp") svixTimestamp: string,
    @Headers("svix-signature") svixSignature: string
  ): Promise<{ received: boolean }> {
    const secret = this.config.get<string>("CLERK_WEBHOOK_SECRET");
    if (!secret) {
      throw new UnauthorizedException("CLERK_WEBHOOK_SECRET no configurada");
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      return { received: false };
    }

    const wh = new Webhook(secret);
    let event: ClerkWebhookEvent;

    try {
      event = wh.verify(rawBody, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature
      }) as ClerkWebhookEvent;
    } catch {
      return { received: false };
    }

    await this.webhookService.handleEvent(event);
    return { received: true };
  }
}
