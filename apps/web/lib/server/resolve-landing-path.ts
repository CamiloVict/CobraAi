import { auth } from "@clerk/nextjs/server";
import { getGatewayOrigin } from "../api-client";
import {
  landingPathForPortfolioCount,
  type LandingPath
} from "../landing-path";
import type { ApiListResponse, Portfolio } from "../types";

export async function resolveServerLandingPath(): Promise<LandingPath> {
  const { getToken, orgId } = await auth();
  if (!orgId) {
    return "/portfolios";
  }

  const token = await getToken();
  if (!token) {
    return "/portfolios";
  }

  try {
    const res = await fetch(
      `${getGatewayOrigin()}/api/v1/portfolios?limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Id": orgId
        },
        cache: "no-store"
      }
    );

    if (!res.ok) {
      return "/dashboard";
    }

    const json = (await res.json()) as ApiListResponse<Portfolio>;
    const total = json.data?.pagination?.total ?? json.data?.items?.length ?? 0;
    return landingPathForPortfolioCount(total);
  } catch {
    return "/dashboard";
  }
}
