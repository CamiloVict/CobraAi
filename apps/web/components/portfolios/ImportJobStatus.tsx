"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  XCircle
} from "lucide-react";
import { useImportJobs } from "../../contexts/ImportJobsContext";
import { isImportJobFinished } from "../../lib/import-job-types";
import { cn } from "../../lib/utils";

export function ImportJobStatus({
  portfolioId
}: {
  portfolioId: string;
}): React.ReactElement | null {
  const { jobs, dismissJob } = useImportJobs();
  const job = jobs.find((item) => item.portfolioId === portfolioId);

  if (!job) return null;

  const isActive = !isImportJobFinished(job.status);
  const isFailed = job.status === "failed";
  const totalRows = job.estimated_rows || job.processed_rows;
  const progressPct =
    totalRows > 0
      ? Math.min(100, Math.round((job.processed_rows / totalRows) * 100))
      : isActive
        ? 8
        : 100;

  const errors = job.errors ?? [];
  const failureMessage = job.failure_message?.trim();
  const skippedRows = Math.max(0, totalRows - job.success_rows - job.error_rows);
  const isSuccess =
    job.status === "completed" && job.error_rows === 0 && job.success_rows > 0;
  const isPartial =
    job.status === "completed" && job.error_rows > 0 && job.success_rows > 0;
  const isTotalFailure =
    job.status === "completed" && job.success_rows === 0 && job.error_rows > 0;

  return (
    <section
      className={cn(
        "rounded-xl border bg-white p-5 dark:bg-slate-900",
        isActive && "border-slate-200 dark:border-slate-800",
        isSuccess && "border-emerald-200 dark:border-emerald-900/50",
        isPartial && "border-amber-200 dark:border-amber-900/50",
        (isFailed || isTotalFailure) && "border-red-200 dark:border-red-900/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {isActive ? (
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#D85A30]" />
          ) : isSuccess ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : isFailed || isTotalFailure ? (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {isActive
                ? "Procesando archivo…"
                : isFailed
                  ? "Importación detenida"
                  : "Resumen de lectura del archivo"}
            </h3>
            {job.fileName ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{job.fileName}</span>
              </p>
            ) : null}
          </div>
        </div>
        {isActive ? (
          <span className="shrink-0 rounded-full bg-[#D85A30]/10 px-2 py-0.5 text-xs font-medium text-[#D85A30]">
            En curso
          </span>
        ) : null}
      </div>

      {isFailed && failureMessage ? (
        <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {failureMessage}
        </p>
      ) : null}

      {isActive ? (
        <>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#D85A30] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {job.processed_rows} de {totalRows || "…"} filas procesadas
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Si el servicio falla, la importación se detendrá y podrás reintentar.
          </p>
        </>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Filas en archivo" value={totalRows} />
            <SummaryStat
              highlight="success"
              label="Importadas"
              value={job.success_rows}
            />
            <SummaryStat
              highlight={job.error_rows > 0 ? "warning" : undefined}
              label="Con error"
              value={job.error_rows}
            />
            <SummaryStat label="Procesadas" value={job.processed_rows} />
          </dl>

          {skippedRows > 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              {skippedRows} fila{skippedRows === 1 ? "" : "s"} no importada
              {skippedRows === 1 ? "" : "s"} (vacías o omitidas).
            </p>
          ) : null}

          {errors.length > 0 ? (
            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Detalle de errores ({errors.length})
              </p>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-600 dark:text-slate-400">
                {errors.slice(0, 25).map((msg, i) => (
                  <li className="font-mono leading-relaxed" key={`${i}-${msg}`}>
                    {msg}
                  </li>
                ))}
              </ul>
              {errors.length > 25 ? (
                <p className="mt-2 text-[10px] text-slate-400">
                  y {errors.length - 25} más…
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {!isFailed && job.success_rows > 0 ? (
              <Link
                className="rounded-md bg-[#D85A30] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#c24f29]"
                href={`/portfolios/${portfolioId}` as Route}
              >
                Ver portafolio
              </Link>
            ) : null}
            <button
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                isFailed || isTotalFailure
                  ? "bg-[#D85A30] text-white hover:bg-[#c24f29]"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
              onClick={() => dismissJob(portfolioId, job.jobId)}
              type="button"
            >
              {isFailed || isTotalFailure
                ? "Reintentar con otro archivo"
                : "Importar otro archivo"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function SummaryStat({
  label,
  value,
  highlight
}: {
  label: string;
  value: number;
  highlight?: "success" | "warning";
}): React.ReactElement {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100",
          highlight === "success" && "text-emerald-700 dark:text-emerald-400",
          highlight === "warning" && "text-amber-700 dark:text-amber-400"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
