import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import twilio from "twilio";
import type {
  WhatsAppPort,
  SendWhatsAppTemplateInput,
  SendWhatsAppTemplateResult
} from "@cobrai/ports";
import { PrismaService } from "@cobrai/db";

@Injectable()
export class TwilioWhatsAppAdapter implements WhatsAppPort {
  private readonly logger = new Logger(TwilioWhatsAppAdapter.name);
  private readonly client: ReturnType<typeof twilio>;
  private readonly from: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.client = twilio(
      config.getOrThrow<string>("TWILIO_ACCOUNT_SID"),
      config.getOrThrow<string>("TWILIO_AUTH_TOKEN")
    );
    this.from = config.getOrThrow<string>("TWILIO_WA_FROM");
  }

  async sendTemplate(
    input: SendWhatsAppTemplateInput
  ): Promise<SendWhatsAppTemplateResult> {
    const to = input.to.startsWith("whatsapp:")
      ? input.to
      : `whatsapp:${input.to}`;

    const body = this.renderBody(input.template_id, input.variables);

    try {
      const msg = await this.client.messages.create({
        from: this.from,
        to,
        body
      });
      this.logger.log(`WA enviado SID=${msg.sid} to=${to}`);
      return { message_id: msg.sid, status: "sent" };
    } catch (err: unknown) {
      this.logger.error(`WA fallido to=${to}: ${String(err)}`);
      return { message_id: "", status: "failed" };
    }
  }

  async isOptedIn(phone: string, tenant_id: string): Promise<boolean> {
    const consent = await this.prisma.contactConsent.findFirst({
      where: {
        tenantId: tenant_id,
        channel: "whatsapp",
        revokedAt: null,
        deletedAt: null
      }
    });
    return !!consent;
  }

  private renderBody(
    templateId: string,
    variables: Record<string, string>
  ): string {
    const nombre =
      variables.nombre ?? variables.debtor_name ?? "estimado cliente";
    const monto = variables.monto ?? variables.amount ?? "";
    const link = variables.link_pago ?? variables.link ?? "";
    const body = variables.body ?? "";

    // Si viene body pre-renderizado (desde agent response), usarlo directamente
    if (body) return body;

    if (templateId.includes("recordatorio")) {
      return `Hola ${nombre}, le recordamos que tiene un saldo pendiente de $${monto}. Puede pagarlo aquí: ${link}`;
    }
    if (templateId.includes("plan_pago")) {
      return `Hola ${nombre}, tenemos una propuesta de plan de pago para su saldo de $${monto}. Contáctenos para más información.`;
    }
    if (templateId.includes("confirmacion")) {
      return `Hola ${nombre}, confirmamos recepción de su pago. ¡Gracias!`;
    }
    return `Hola ${nombre}, le contactamos de CobraAI sobre su cuenta. Saldo: $${monto}. Info: ${link}`;
  }
}
