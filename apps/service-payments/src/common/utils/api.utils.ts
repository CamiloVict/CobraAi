import type { ApiMeta, ApiSuccessResponse } from "@cobrai/types";
import { randomUUID } from "node:crypto";
import type { PaymentGateway } from "@cobrai/db";

export function successResponse<T>(
  data: T,
  requestId?: string
): ApiSuccessResponse<T> {
  const meta: ApiMeta = {
    request_id: requestId ?? randomUUID(),
    timestamp: new Date().toISOString()
  };
  return { success: true, data, meta };
}

export function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export function maskDebtorName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "****";
  const first = parts[0] ?? "Cliente";
  const lastInitial = parts.length > 1 ? `${parts[parts.length - 1]?.[0] ?? ""}***` : "***";
  return `${first} ${lastInitial}`;
}

export function countryFromAddress(address: unknown): string {
  if (!address || typeof address !== "object") return "CO";
  const country = (address as { country?: string }).country;
  return country?.toUpperCase().slice(0, 2) ?? "CO";
}

export function pickGateway(currency: string, country: string): PaymentGateway {
  if (currency === "MXN" || country === "MX") return "conekta";
  if (["COP", "ARS", "BRL"].includes(currency) || ["CO", "AR", "BR"].includes(country)) {
    return "mercadopago";
  }
  return "transfer";
}

export function gatewayOptionsForCountry(country: string): PaymentGateway[] {
  if (country === "MX") return ["conekta", "spei", "card"];
  if (country === "CO") return ["mercadopago", "pse", "card"];
  if (country === "BR") return ["mercadopago", "pix", "card"];
  if (country === "AR") return ["mercadopago", "card"];
  return ["transfer", "card"];
}
