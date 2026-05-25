import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import type {
  VoiceAgentPort,
  InitiateCallInput,
  InitiateCallResult,
  CallStatus,
} from "@cobrai/ports";

interface VapiCallResponse {
  id: string;
  status: string;
}

@Injectable()
export class VapiVoiceAdapter implements VoiceAgentPort {
  private readonly logger = new Logger(VapiVoiceAdapter.name);
  private readonly baseUrl = "https://api.vapi.ai";
  private readonly apiKey: string;
  private readonly agentId: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.getOrThrow<string>("VAPI_API_KEY");
    this.agentId = config.getOrThrow<string>("VAPI_AGENT_ID");
  }

  async initiateCall(input: InitiateCallInput): Promise<InitiateCallResult> {
    const ctx = input.strategy_context;
    const phone = input.debtor_phone.startsWith("+")
      ? input.debtor_phone
      : `+${input.debtor_phone}`;

    try {
      const response = await axios.post<VapiCallResponse>(
        `${this.baseUrl}/call`,
        {
          assistantId: this.agentId,
          phoneNumberId: undefined,
          customer: {
            number: phone,
            name: ctx.variables["nombre"] ?? ctx.variables["debtor_name"],
          },
          assistantOverrides: {
            variableValues: {
              nombre: ctx.variables["nombre"] ?? "cliente",
              monto: ctx.variables["monto"] ?? ctx.variables["amount"] ?? "0",
              empresa: ctx.variables["empresa"] ?? "CobraAI",
              fecha_vencimiento: ctx.variables["due_date"] ?? "",
              link_pago: ctx.variables["link_pago"] ?? ctx.variables["payment_link"] ?? "",
            },
          },
          metadata: {
            debt_id: input.debt_id,
            tenant_id: ctx.tenant_id,
            strategy_id: ctx.strategy_id,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      this.logger.log(
        `Llamada Vapi iniciada call_id=${response.data.id} → ${phone}`,
      );
      return { call_id: response.data.id, status: "queued" };
    } catch (err: unknown) {
      this.logger.error(`Vapi call fallida → ${phone}: ${String(err)}`);
      return { call_id: "", status: "failed" };
    }
  }

  async getCallStatus(call_id: string): Promise<CallStatus> {
    try {
      const response = await axios.get<VapiCallResponse>(
        `${this.baseUrl}/call/${call_id}`,
        { headers: { Authorization: `Bearer ${this.apiKey}` } },
      );
      const mapped = this.mapStatus(response.data.status);
      return { call_id, status: mapped };
    } catch {
      return { call_id, status: "queued" };
    }
  }

  private mapStatus(
    vapiStatus: string,
  ): "queued" | "ringing" | "in_progress" | "completed" | "failed" | "no_answer" | "busy" {
    switch (vapiStatus) {
      case "queued":
        return "queued";
      case "ringing":
        return "ringing";
      case "in-progress":
      case "in_progress":
        return "in_progress";
      case "ended":
        return "completed";
      case "failed":
        return "failed";
      case "no-answer":
      case "no_answer":
        return "no_answer";
      case "busy":
        return "busy";
      default:
        return "queued";
    }
  }
}
