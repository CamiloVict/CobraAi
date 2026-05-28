"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useImportJobs } from "../../contexts/ImportJobsContext";
import { cn } from "../../lib/utils";

export function ImportDropzone({
  portfolioId,
  portfolioName,
  disabled = false,
  disabledHint
}: {
  portfolioId: string;
  portfolioName?: string;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const { trackJob } = useImportJobs();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      if (disabled) return;
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`/api/import/${portfolioId}`, {
          method: "POST",
          body: form,
          keepalive: true
        });
        const json = (await res.json()) as {
          success?: boolean;
          data?: { job_id: string; estimated_rows?: number; status?: string };
          error?: { message?: string };
        };
        if (!res.ok || !json.success || !json.data?.job_id) {
          throw new Error(json.error?.message ?? "Error al importar");
        }
        const estimated = json.data.estimated_rows ?? 0;
        trackJob({
          portfolioId,
          jobId: json.data.job_id,
          portfolioName,
          fileName: file.name,
          startedAt: new Date().toISOString(),
          snapshot: {
            status: json.data.status ?? "queued",
            estimated_rows: estimated,
            processed_rows: 0,
            success_rows: 0,
            error_rows: 0,
            errors: []
          }
        });
        toast.success("Importación en curso — puedes cambiar de pestaña");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al importar");
      } finally {
        setUploading(false);
      }
    },
    [disabled, portfolioId, portfolioName, trackJob]
  );

  const isDisabled = disabled || uploading;

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) void upload(file);
    },
    [upload]
  );

  return (
    <label
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition lg:min-h-[240px]",
        isDisabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70 dark:border-slate-800 dark:bg-slate-900/50"
          : "cursor-pointer border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900",
        !isDisabled && dragging && "border-[#D85A30] bg-[#D85A30]/5"
      )}
      onDragLeave={() => setDragging(false)}
      onDragOver={(e) => {
        if (isDisabled) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDrop={onDrop}
    >
      <Upload
        className={cn(
          "h-10 w-10",
          isDisabled ? "text-slate-400" : "text-[#D85A30]"
        )}
      />
      <p className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-100">
        {isDisabled && disabledHint
          ? "Subida pausada"
          : "Arrastra CSV, Excel o PDF aquí"}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {isDisabled && disabledHint
          ? disabledHint
          : "o haz clic para seleccionar"}
      </p>
      <input
        accept=".csv,.xlsx,.xls,.pdf"
        className="sr-only"
        disabled={isDisabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
        type="file"
      />
    </label>
  );
}

