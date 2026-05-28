"use client";

import { FolderOpen } from "lucide-react";
import { CreatePortfolioModal } from "./CreatePortfolioModal";

export function PortfoliosEmptyState(): React.ReactElement {
  return (
    <article className="flex flex-col gap-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center md:justify-between md:gap-10 md:p-8">
      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#D85A30]/10 text-[#D85A30]"
        >
          <FolderOpen className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Crea tu primer portafolio
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Un portafolio agrupa tu cartera importada. Desde aquí podrás subir
            deudores, activar automatización y ver el pipeline por trimestre.
          </p>
          <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                1
              </span>
              Nombre y estrategia
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                2
              </span>
              Importar CSV o Excel
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                3
              </span>
              Gestionar desde el dashboard
            </li>
          </ol>
        </div>
      </div>
      <div className="shrink-0 md:self-center">
        <CreatePortfolioModal
          triggerClassName="w-full rounded-lg bg-[#D85A30] px-6 py-3 text-base font-medium text-white hover:bg-[#c24f29] sm:w-auto"
          triggerLabel="Crear primer portafolio"
        />
      </div>
    </article>
  );
}
