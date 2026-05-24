import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { PaymentGateway } from "@cobrai/db";
import { randomUUID } from "node:crypto";

export type CheckoutSession = {
  gateway_payment_url: string;
  gateway_ref: string;
  instructions?: string;
};

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(private readonly config: ConfigService) {}

  async createCheckout(input: {
    gateway: PaymentGateway;
    amount: number;
    currency: string;
    token: string;
    debtorName: string;
  }): Promise<CheckoutSession> {
    const ref = randomUUID();

    if (input.gateway === "conekta") {
      return this.createConektaCheckout(input, ref);
    }
    if (input.gateway === "mercadopago") {
      return this.createMercadoPagoCheckout(input, ref);
    }
    return this.createTransferCheckout(input, ref);
  }

  private async createConektaCheckout(
    input: {
      amount: number;
      currency: string;
      token: string;
    },
    ref: string
  ): Promise<CheckoutSession> {
    const apiKey = this.config.get<string>("CONEKTA_PRIVATE_KEY");
    if (!apiKey) {
      this.logger.warn("Conekta sandbox: checkout simulado");
      return {
        gateway_payment_url: `https://pay.conekta.com/sandbox/${ref}?token=${input.token}`,
        gateway_ref: ref
      };
    }

    const response = await fetch("https://api.conekta.io/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.conekta-v2.1.0+json"
      },
      body: JSON.stringify({
        currency: input.currency,
        customer_info: { name: "CobraAI Debtor", email: "payer@cobrai.dev" },
        line_items: [
          {
            name: "Pago de deuda",
            unit_price: Math.round(input.amount * 100),
            quantity: 1
          }
        ],
        metadata: { payment_token: input.token, gateway_ref: ref }
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      this.logger.error(`Conekta error: ${detail}`);
      throw new Error("No se pudo crear orden Conekta");
    }

    const data = (await response.json()) as {
      id?: string;
      checkout?: { url?: string };
    };

    return {
      gateway_payment_url: data.checkout?.url ?? `https://pay.conekta.com/${data.id}`,
      gateway_ref: data.id ?? ref
    };
  }

  private async createMercadoPagoCheckout(
    input: {
      amount: number;
      currency: string;
      token: string;
    },
    ref: string
  ): Promise<CheckoutSession> {
    const accessToken = this.config.get<string>("MP_ACCESS_TOKEN");
    if (!accessToken) {
      this.logger.warn("Mercado Pago sandbox: checkout simulado");
      return {
        gateway_payment_url: `https://www.mercadopago.com/sandbox/checkout/${ref}?token=${input.token}`,
        gateway_ref: ref
      };
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: [
          {
            title: "Pago de deuda CobraAI",
            quantity: 1,
            unit_price: input.amount,
            currency_id: input.currency
          }
        ],
        external_reference: input.token,
        metadata: { gateway_ref: ref }
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      this.logger.error(`Mercado Pago error: ${detail}`);
      throw new Error("No se pudo crear preferencia MP");
    }

    const data = (await response.json()) as {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
    };

    return {
      gateway_payment_url: data.sandbox_init_point ?? data.init_point ?? "",
      gateway_ref: data.id ?? ref
    };
  }

  private createTransferCheckout(
    input: { amount: number; currency: string },
    ref: string
  ): CheckoutSession {
    return {
      gateway_payment_url: "",
      gateway_ref: ref,
      instructions: `Transferencia bancaria por ${input.currency} ${input.amount}. Referencia: ${ref}`
    };
  }
}
