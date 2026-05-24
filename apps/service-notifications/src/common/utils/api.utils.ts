import type { ApiMeta, ApiSuccessResponse } from "@cobrai/types";
import { randomUUID } from "node:crypto";

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

export function renderTemplate(
  content: string,
  variables: Record<string, string>
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? "");
}

export function truncateSms(body: string, max = 160): string {
  if (body.length <= max) return body;
  return `${body.slice(0, max - 1)}…`;
}

export function parseMessagePayload(content: string): {
  text: string;
  provider_message_id?: string;
} {
  try {
    const parsed = JSON.parse(content) as {
      text?: string;
      provider_message_id?: string;
    };
    if (parsed.text !== undefined) return { text: parsed.text, provider_message_id: parsed.provider_message_id };
  } catch {
    /* plain text */
  }
  return { text: content };
}

export function buildMessageContent(
  text: string,
  providerMessageId?: string
): string {
  return JSON.stringify({
    text,
    ...(providerMessageId ? { provider_message_id: providerMessageId } : {})
  });
}

export function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export function phonesFromDebtor(phones: unknown): string[] {
  if (!Array.isArray(phones)) return [];
  return phones.filter((p): p is string => typeof p === "string" && p.length > 0);
}

export function countryFromAddress(address: unknown): string {
  if (!address || typeof address !== "object") return "CO";
  const country = (address as { country?: string }).country;
  return country?.toUpperCase().slice(0, 2) ?? "CO";
}
