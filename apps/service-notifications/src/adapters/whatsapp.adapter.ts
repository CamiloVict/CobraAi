import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type {
  SendWhatsAppTemplateInput,
  SendWhatsAppTemplateResult,
  WhatsAppPort
} from "@cobrai/ports";
import { KafkaService } from "../kafka/kafka.service";

@Injectable()
export class WhatsAppAdapter implements WhatsAppPort {
  private readonly logger = new Logger(WhatsAppAdapter.name);

  constructor(private readonly kafka: KafkaService) {}

  async sendTemplate(
    input: SendWhatsAppTemplateInput
  ): Promise<SendWhatsAppTemplateResult> {
    const messageId = randomUUID();

    await this.kafka.publish("cobrai.whatsapp.send_requested", input.tenant_id, {
      message_id: messageId,
      to: input.to,
      template_id: input.template_id,
      variables: input.variables
    });

    this.logger.log(`WhatsApp stub encolado ${messageId} → ${input.to}`);
    return { message_id: messageId, status: "sent" };
  }

  async isOptedIn(phone: string, tenant_id: string): Promise<boolean> {
    void tenant_id;
    return phone.length > 0;
  }
}
