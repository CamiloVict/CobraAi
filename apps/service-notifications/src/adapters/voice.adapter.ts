import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type {
  InitiateCallInput,
  InitiateCallResult,
  VoiceAgentPort,
  CallStatus,
  CallStatusValue
} from "@cobrai/ports";
import { KafkaService } from "../kafka/kafka.service";

@Injectable()
export class VoiceAdapter implements VoiceAgentPort {
  private readonly logger = new Logger(VoiceAdapter.name);
  private readonly calls = new Map<string, CallStatusValue>();

  constructor(private readonly kafka: KafkaService) {}

  async initiateCall(input: InitiateCallInput): Promise<InitiateCallResult> {
    const callId = randomUUID();
    const tenantId = input.strategy_context.tenant_id;

    await this.kafka.publish("cobrai.voice.call_requested", tenantId, {
      call_id: callId,
      debt_id: input.debt_id,
      debtor_phone: input.debtor_phone,
      strategy_context: input.strategy_context
    });

    this.calls.set(callId, "queued");
    this.logger.log(`Voice stub encolado ${callId} → ${input.debtor_phone}`);
    return { call_id: callId, status: "queued" };
  }

  async getCallStatus(call_id: string): Promise<CallStatus> {
    return {
      call_id,
      status: this.calls.get(call_id) ?? "queued"
    };
  }
}
