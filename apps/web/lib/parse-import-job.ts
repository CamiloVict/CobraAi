import type { ImportJobSnapshot } from "./import-job-types";

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Normaliza la respuesta del API (snake_case o camelCase). */
export function parseImportJobSnapshot(
  raw: Record<string, unknown> | null | undefined
): ImportJobSnapshot | null {
  if (!raw) return null;

  const status = String(raw.status ?? raw["status"] ?? "queued");
  const errorsRaw = raw.errors ?? raw["errors"];
  const errors = Array.isArray(errorsRaw)
    ? errorsRaw.map((e) => String(e))
    : [];

  const failureMessage = raw.failure_message ?? raw.failureMessage;

  return {
    ...(raw.job_id || raw.jobId
      ? { job_id: String(raw.job_id ?? raw.jobId) }
      : {}),
    status,
    estimated_rows: num(raw.estimated_rows ?? raw.estimatedRows),
    processed_rows: num(raw.processed_rows ?? raw.processedRows),
    success_rows: num(raw.success_rows ?? raw.successRows),
    error_rows: num(raw.error_rows ?? raw.errorRows),
    errors,
    failure_message:
      failureMessage != null && String(failureMessage).trim() !== ""
        ? String(failureMessage)
        : null
  };
}

export function portfoliosImportBaseUrl(): string {
  return (
    process.env.SERVICE_PORTFOLIOS_URL ??
    process.env.NEXT_PUBLIC_API_URL?.replace(":3000", ":3011") ??
    "http://localhost:3011"
  ).replace(/\/$/, "");
}
