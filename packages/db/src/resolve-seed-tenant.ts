export type SeedTenantSource = "env" | "clerk" | "default";

export interface ResolvedSeedTenant {
  id: string;
  name: string;
  slug: string;
  source: SeedTenantSource;
}

export async function resolveSeedTenant(): Promise<ResolvedSeedTenant> {
  const explicit = process.env.SEED_TENANT_ID?.trim();
  if (explicit) {
    return {
      id: explicit,
      name: process.env.SEED_TENANT_NAME ?? "Demo Fintech",
      slug: process.env.SEED_TENANT_SLUG ?? slugify(explicit),
      source: "env"
    };
  }

  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (secret) {
    try {
      const response = await fetch(
        "https://api.clerk.com/v1/organizations?limit=5",
        {
          headers: { Authorization: `Bearer ${secret}` }
        }
      );

      if (response.ok) {
        const json = (await response.json()) as {
          data?: { id: string; name: string; slug?: string | null }[];
        };
        const org = json.data?.[0];
        if (org) {
          return {
            id: org.id,
            name: org.name,
            slug: org.slug ?? slugify(org.name),
            source: "clerk"
          };
        }
      }
    } catch (error) {
      console.warn("No se pudo consultar la API de Clerk:", error);
    }
  }

  return {
    id: "org_demo_fintech",
    name: "Demo Fintech",
    slug: "demo",
    source: "default"
  };
}

export async function listClerkOrganizations(): Promise<
  { id: string; name: string; slug?: string | null }[]
> {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) return [];

  const response = await fetch(
    "https://api.clerk.com/v1/organizations?limit=10",
    { headers: { Authorization: `Bearer ${secret}` } }
  );
  if (!response.ok) return [];

  const json = (await response.json()) as {
    data?: { id: string; name: string; slug?: string | null }[];
  };
  return json.data ?? [];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
