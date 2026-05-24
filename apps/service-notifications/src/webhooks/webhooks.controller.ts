import { Body, Controller, Post } from "@nestjs/common";
import { successResponse } from "../common/utils/api.utils";
import { WebhooksService } from "./webhooks.service";

@Controller("v1/webhooks")
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post("sendgrid")
  async sendgrid(@Body() body: unknown) {
    const events = Array.isArray(body) ? body : [body];
    await this.webhooksService.handleSendGrid(events);
    return successResponse({ received: events.length });
  }

  @Post("twilio")
  async twilio(@Body() body: Record<string, string>) {
    await this.webhooksService.handleTwilio(body);
    return successResponse({ received: true });
  }

  @Post("whatsapp")
  async whatsapp(@Body() body: Record<string, unknown>) {
    await this.webhooksService.handleWhatsApp(body);
    return successResponse({ received: true });
  }
}
