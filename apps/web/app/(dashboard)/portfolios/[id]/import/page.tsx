"use client";

import type { Route } from "next";
import Link from "next/link";
import { PortfolioImportSection } from "../../../../../components/portfolios/PortfolioImportSection";
import { usePortfolio } from "../../../../../hooks/use-portfolios";

export default function PortfolioImportPage({
  params
}: {
  params: { id: string };
}): React.ReactElement {
  const portfolioQuery = usePortfolio(params.id);
  const portfolio = portfolioQuery.data?.data;

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header>
        <Link
          className="text-sm text-[#D85A30] hover:underline"
          href={`/portfolios/${params.id}` as Route}
        >
          ← {portfolio?.name ?? "Portafolio"}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          Importar cartera
        </h1>
      </header>

      <PortfolioImportSection
        portfolioId={params.id}
        portfolioName={portfolio?.name}
      />
    </section>
  );
}
