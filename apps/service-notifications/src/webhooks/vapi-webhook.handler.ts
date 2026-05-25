import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@cobrai/db";
import { KafkaService } from "../kafka/kafka.service";

type ContactOutcome =
  | "promise_made"
  | "payment_received"
  | "no_answer"
  | "refused"
  | "voicemail"
  | "wrong_number"
  | "callback_requested";

export interface VapiWebhookPayload {
  message: {
    type: "end-of-call-report" | "status-update" | "transcript";
    call: {
      id: string;
      status: string;
      startedAt?: string;
      endedAt?: string;
      metadata?: {
        debt_id?: string;
        tenant_id?: string;
        strategy_id?: string;
      };
      endedReason?: string;
    };
    transcript?: string;
    summary?: string;
    analysis?: {
      successEvaluation?: string; // 'true' | 'false'
      structuredData?: Record<string, unknown>;
    };
  };
}

@Injectable()
export class VapiWebhookHandler {
  private readonly logger = new Logger(VapiWebhookHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaService,
  ) {}

  async handleEndOfCall(payload: VapiWebhookPayload): Promise<void> {
    const { call, transcript, summary, analysis } = payload.message;
    const meta = call.metadata ?? {};
    const debtId = meta.debt_id;
    const tenantId = meta.tenant_id;

    if (!debtId || !tenantId) {
      this.logger.warn(`Webhook Vapi sin metadata: call_id=${call.id}`);
      return;
    }

    const durationSecs =
      call.startedAt && call.endedAt
        ? Math.round(
            (new Date(call.endedAt).getTime() -
              new Date(call.startedAt).getTime()) /
              1000,
          )
        : null;

    const outcome = this.mapOutcome(call.endedReason, analysis);
    const successEval = analysis?.successEvaluation === "true";

    // 1. Actualizar contact record (el último contact de voz in_progress o scheduled para esta deuda)
    await this.prisma.contact.updateMany({
      where: {
        tenantId,
        debtId,
        channel: "voice",
        status: { in: ["in_progress", "scheduled"] },
      },
      data: {
        status: "completed",
        outcome,
        transcriptUrl: null, // transcript guardado inline en messages
        durationSeconds: durationSecs,
        endedAt: call.endedAt ? new Date(call.endedAt) : new Date(),
      },
    });

    // 2. Guardar transcript en tabla messages si llega
    if (transcript) {
      await this.saveTranscript(
        tenantId,
        debtId,
        call.id,
        transcript,
        summary,
      );
    }

    // 3. Publicar cobrai.voice.call_completed
    await this.kafka.publish("cobrai.voice.call_completed", tenantId, {
      call_id: call.id,
      debt_id: debtId,
      tenant_id: tenantId,
      outcome,
      success: successEval,
      duration_seconds: durationSecs,
      transcript: transcript ?? null,
      summary: summary ?? null,
      ended_reason: call.endedReason,
    });

    this.logger.log(
      `Llamada Vapi ${call.id} completada: outcome=${outcome} success=${successEval}`,
    );
  }

  private mapOutcome(
    endedReason?: string,
    analysis?: VapiWebhookPayload["message"]["analysis"],
  ): ContactOutcome {
    if (!endedReason) return "no_answer";
    switch (endedReason) {
      case "customer-ended-call":
        return "refused"; // cliente colgó sin promesa
      case "assistant-ended-call":
        return analysis?.successEvaluation === "true"
          ? "promise_made"
          : "refused";
      case "customer-did-not-answer":
        return "no_answer";
      case "voicemail":
        return "voicemail";
      case "line-busy":
        return "refused"; // no hay "busy" en ContactOutcome; lo mapeamos a refused
      case "error":
        return "no_answer"; // fallo técnico
      default:
        return "refused";
    }
  }

  private async saveTranscript(
    tenantId: string,
    debtId: string,
    callId: string,
    transcript: string,
    summary?: string,
  ): Promise<void> {
    // Buscar deudor de la deuda
    const debt = await this.prisma.debt.findFirst({
      where: { id: debtId, tenantId },
      select: { debtorId: true },
    });
    if (!debt) return;

    // Buscar o crear conversación de voz
    let conv = await this.prisma.conversation.findFirst({
      where: {
        tenantId,
        debtorId: debt.debtorId,
        channel: "voice",
        deletedAt: null,
      },
    });
    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: {
          tenantId,
          debtorId: debt.debtorId,
          debtId,
          channel: "voice",
          status: "closed",
          lastMessageAt: new Date(),
        },
      });
    }

    // Guardar transcript como mensaje en la conversación
    await this.prisma.message.create({
      data: {
        tenantId,
        conversationId: conv.id,
        direction: "out",
        channel: "voice",
        content: JSON.stringify({
          call_id: callId,
          transcript,
          summary: summary ?? null,
        }),
        status: "delivered",
        sentAt: new Date(),
      },
    });
  }
}
