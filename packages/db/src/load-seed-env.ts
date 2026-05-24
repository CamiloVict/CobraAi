import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/** Carga variables del monorepo (root, web, gateway) para seed y Clerk. */
export function loadSeedEnv(): void {
  const root = resolve(__dirname, "../../..");
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(root, ".env"),
    resolve(root, "apps/web/.env.local"),
    resolve(root, "apps/api-gateway/.env")
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      loadEnv({ path, override: false });
    }
  }
}
