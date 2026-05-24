#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

copy_if_missing() {
  local src="$1"
  local dest="$2"
  if [[ -f "$dest" ]]; then
    echo "[env-setup] SKIP $dest (ya existe)"
  elif [[ -f "$src" ]]; then
    cp "$src" "$dest"
    echo "[env-setup] OK   $dest ← $src"
  else
    echo "[env-setup] WARN no existe $src"
  fi
}

echo "[env-setup] Copiando .env.example → .env (sin sobrescribir)"

copy_if_missing ".env.example" ".env"
copy_if_missing "apps/web/.env.example" "apps/web/.env.local"
copy_if_missing "apps/api-gateway/.env.example" "apps/api-gateway/.env"
copy_if_missing "apps/service-portfolios/.env.example" "apps/service-portfolios/.env"
copy_if_missing "apps/service-workflows/.env.example" "apps/service-workflows/.env"
copy_if_missing "apps/service-notifications/.env.example" "apps/service-notifications/.env"
copy_if_missing "apps/service-payments/.env.example" "apps/service-payments/.env"
copy_if_missing "packages/db/.env.example" "packages/db/.env"

echo ""
echo "[env-setup] Siguiente:"
echo "  1. Completar claves Clerk en .env, apps/web/.env.local y apps/api-gateway/.env"
echo "  2. pnpm infra:up && pnpm db:generate && pnpm db:migrate && pnpm db:seed"
echo "  3. Tras login: pnpm db:seed:align"
echo "  4. Guía completa: docs/ENV.md"
