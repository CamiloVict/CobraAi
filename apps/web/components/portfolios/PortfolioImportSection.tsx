"use client";

import { useImportJobs } from "../../contexts/ImportJobsContext";
import { ImportDropzone } from "./ImportDropzone";
import { ImportJobStatus } from "./ImportJobStatus";
import { ImportTemplatePanel } from "./ImportTemplatePanel";

type PortfolioImportSectionProps = {
  portfolioId: string;
  portfolioName?: string;
};

export function PortfolioImportSection({
  portfolioId,
  portfolioName
}: PortfolioImportSectionProps): React.ReactElement {
  const { hasActiveJobForPortfolio } = useImportJobs();
  const importInProgress = hasActiveJobForPortfolio(portfolioId);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Sube un CSV, Excel o PDF con tus deudas. También puedes descargar nuestro
        template y llenarlo directamente.
      </p>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ImportTemplatePanel layout="compact" />

        <div className="flex min-w-0 flex-col gap-4">
          <ImportDropzone
            disabled={importInProgress}
            disabledHint="Hay una importación en curso. Espera a que termine o se detenga por error."
            portfolioId={portfolioId}
            portfolioName={portfolioName}
          />
          <ImportJobStatus portfolioId={portfolioId} />
        </div>
      </div>
    </div>
  );
}
