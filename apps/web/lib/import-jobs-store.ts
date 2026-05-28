import type { ImportJobSnapshot } from "./import-job-types";

export type StoredImportJob = {
  portfolioId: string;
  jobId: string;
  portfolioName?: string;
  fileName?: string;
  startedAt: string;
  /** Último estado conocido (p. ej. al completar), para mostrar resumen tras recargar */
  snapshot?: ImportJobSnapshot;
};

const STORAGE_KEY = "cobrai-import-jobs";

function readJobs(): StoredImportJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredImportJob[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJobs(jobs: StoredImportJob[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function listImportJobs(): StoredImportJob[] {
  return readJobs();
}

export function getImportJobForPortfolio(
  portfolioId: string
): StoredImportJob | undefined {
  return readJobs().find((job) => job.portfolioId === portfolioId);
}

export function addImportJob(job: StoredImportJob): void {
  const jobs = readJobs().filter(
    (existing) => existing.portfolioId !== job.portfolioId
  );
  writeJobs([job, ...jobs]);
}

export function updateImportJobSnapshot(
  portfolioId: string,
  jobId: string,
  snapshot: ImportJobSnapshot
): void {
  const jobs = readJobs().map((job) =>
    job.portfolioId === portfolioId && job.jobId === jobId
      ? { ...job, snapshot }
      : job
  );
  writeJobs(jobs);
}

export function replaceImportJobIdentity(
  portfolioId: string,
  oldJobId: string,
  newJobId: string,
  snapshot: ImportJobSnapshot
): void {
  const jobs = readJobs().filter(
    (job) => !(job.portfolioId === portfolioId && job.jobId === oldJobId)
  );
  const existing = readJobs().find(
    (job) => job.portfolioId === portfolioId && job.jobId === oldJobId
  );
  if (!existing) return;
  writeJobs([
    {
      ...existing,
      jobId: newJobId,
      snapshot
    },
    ...jobs
  ]);
}

export function removeImportJob(portfolioId: string, jobId: string): void {
  writeJobs(
    readJobs().filter(
      (job) => !(job.portfolioId === portfolioId && job.jobId === jobId)
    )
  );
}
