import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { portfoliosImportBaseUrl } from "../../../../../lib/parse-import-job";

function portfoliosBaseUrl(): string {
  return portfoliosImportBaseUrl();
}

async function authHeaders(): Promise<HeadersInit> {
  const { getToken, orgId } = await auth();
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (orgId) headers["X-Tenant-Id"] = orgId;
  return headers;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ portfolioId: string }> }
): Promise<NextResponse> {
  const { portfolioId } = await context.params;
  const headers = await authHeaders();

  const upstream = await fetch(
    `${portfoliosBaseUrl()}/api/v1/portfolios/${portfolioId}/import/active`,
    { headers, cache: "no-store" }
  );
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "content-type": "application/json" }
  });
}
