"use client";

import { CreatePortfolioModal } from "../../../components/portfolios/CreatePortfolioModal";
import { PortfolioCard } from "../../../components/portfolios/PortfolioCard";
import { PortfoliosEmptyState } from "../../../components/portfolios/PortfoliosEmptyState";
import { CardSkeleton } from "../../../components/shared/Skeleton";
import { usePortfolios } from "../../../hooks/use-portfolios";

export default function PortfoliosPage(): React.ReactElement {
  const { data, isLoading, error } = usePortfolios();
  const items = data?.data.items ?? [];
  const isEmpty = !isLoading && items.length === 0;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Portafolios
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isEmpty
              ? "Empieza creando un portafolio e importa tu cartera"
              : "Carteras importadas y su estado de cobranza"}
          </p>
        </div>
        {!isEmpty ? <CreatePortfolioModal /> : null}
      </header>

      {error ? (
        <p className="text-sm text-[#A32D2D]">
          No se pudieron cargar los portafolios. Verifica el gateway y la
          organización activa.
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isEmpty ? (
        <PortfoliosEmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((portfolio) => (
            <PortfolioCard key={portfolio.id} portfolio={portfolio} />
          ))}
        </div>
      )}
    </section>
  );
}
