"use client";

import { useMemo } from "react";
import { formatCurrency } from "../../lib/formatters";
import { getQuarterLabel } from "../../lib/quarters";
import { usePortfolios, usePortfolioStats } from "../../hooks/use-portfolios";
import type { PortfolioQuarterStat } from "../../lib/types";

function DeferredQuarterBlock({
  portfolioName,
  portfolioId
}: {
  portfolioName: string;
  portfolioId: string;
}) {
  const statsQuery = usePortfolioStats(portfolioId);
  const quarters = ((statsQuery.data?.data?.quarters ?? []) as PortfolioQuarterStat[]).filter(
    (q) => q.status === "upcoming" || q.status === "future"
  );

  if (quarters.length === 0) return null;

  return (
    <>
      {quarters.map((q) => (
        <tr className="border-t border-slate-100 dark:border-slate-800" key={`${portfolioId}-${q.quarter}`}>
          <td className="px-4 py-3">{portfolioName}</td>
          <td className="px-4 py-3">{formatCurrency(q.amount, "COP")}</td>
          <td className="px-4 py-3">{q.debts_count}</td>
          <td className="px-4 py-3 capitalize">{q.status === "upcoming" ? "Próximo" : "Futuro"}</td>
        </tr>
      ))}
    </>
  );
}

export function PortfolioProjectionView() {
  const portfoliosQuery = usePortfolios();
  const portfolios = portfoliosQuery.data?.data.items ?? [];

  const quarterKeys = useMemo(
    () => ["Q3-2026", "Q4-2026"],
    []
  );

  return (
    <section className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Portafolios con pipeline diferido</p>
          <p className="mt-1 text-xl font-bold">{portfolios.length}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Proyección</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Cuentas en estado future/upcoming se activan automáticamente al vencer
          </p>
        </article>
      </div>

      {quarterKeys.map((quarter) => (
        <section key={quarter}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {getQuarterLabel(quarter)}
          </h3>
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-3">Portfolio</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Cuentas</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {portfolios.map((p) => (
                  <DeferredQuarterBlock key={p.id} portfolioId={p.id} portfolioName={p.name} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </section>
  );
}
