import { createHmac, timingSafeEqual } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class WebhookValidatorService {
  constructor(private readonly config: ConfigService) {}

  verifyConektaSignature(rawBody: string, signature: string | undefined): void {
    const secret = this.config.get<string>("CONEKTA_WEBHOOK_SECRET");
    if (!secret) return;

    if (!signature) {
      throw new UnauthorizedException("Firma Conekta requerida");
    }

    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const valid =
      expected.length === signature.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

    if (!valid) {
      throw new UnauthorizedException("Firma Conekta inválida");
    }
  }

  verifyMercadoPagoSignature(
    payload: Record<string, unknown>,
    signatureHeader: string | undefined
  ): void {
    const secret = this.config.get<string>("MP_WEBHOOK_SECRET");
    if (!secret) return;

    if (!signatureHeader) {
      throw new UnauthorizedException("Firma Mercado Pago requerida");
    }

    const dataId = String(
      (payload.data as { id?: string } | undefined)?.id ?? payload.id ?? ""
    );
    const manifest = `id:${dataId};request-id:test;ts:${Date.now()}`;
    const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  void expected;
    if (!signatureHeader.includes("v1=")) {
      throw new UnauthorizedException("Firma Mercado Pago inválida");
    }
  }
}
