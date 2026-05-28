export type ImportJobSnapshot = {
  job_id?: string;
  status: string;
  estimated_rows: number;
  processed_rows: number;
  success_rows: number;
  error_rows: number;
  errors?: string[];
  failure_message?: string | null;
};

export function isImportJobFinished(status: string): boolean {
  return status === "completed" || status === "failed";
}
