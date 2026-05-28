"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { landingPathForPortfolioCount } from "../lib/landing-path";
import { usePortfolios } from "./use-portfolios";

export function useRedirectFromDashboardWhenNoPortfolios(): void {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, orgId } = useAuth();
  const { data, isSuccess } = usePortfolios();

  useEffect(() => {
    if (!isLoaded || !orgId || !isSuccess || pathname !== "/dashboard") {
      return;
    }

    const total = data.data.pagination.total;
    if (total === 0) {
      router.replace("/portfolios");
    }
  }, [data, isLoaded, isSuccess, orgId, pathname, router]);
}

/** Tras onboarding o sesión con org: envía a portafolios o dashboard según cartera. */
export function useResolveLandingAndRedirect(enabled: boolean): void {
  const router = useRouter();
  const { isLoaded, orgId } = useAuth();
  const { data, isSuccess } = usePortfolios();

  useEffect(() => {
    if (!enabled || !isLoaded || !orgId || !isSuccess) {
      return;
    }

    const path = landingPathForPortfolioCount(data.data.pagination.total);
    router.replace(path);
  }, [data, enabled, isLoaded, isSuccess, orgId, router]);
}
