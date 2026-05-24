import type { ApiMeta, ApiSuccessResponse } from "@cobrai/types";
import { randomUUID } from "node:crypto";
import type { AgingBucket } from "@cobrai/db";

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

export function computeAgingDays(dueDate: Date): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setUTCHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function computeAgingBucket(days: number): AgingBucket {
  if (days <= 30) return "d0_30";
  if (days <= 60) return "d31_60";
  if (days <= 90) return "d61_90";
  if (days <= 180) return "d91_180";
  return "d180_plus";
}

export function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
