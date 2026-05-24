-- AlterEnum
ALTER TYPE "aging_bucket" ADD VALUE IF NOT EXISTS 'future';
ALTER TYPE "aging_bucket" ADD VALUE IF NOT EXISTS 'upcoming';

-- AlterEnum
ALTER TYPE "debt_status" ADD VALUE IF NOT EXISTS 'future';
ALTER TYPE "debt_status" ADD VALUE IF NOT EXISTS 'upcoming';

-- AlterTable
ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "scheduled_collection_date" DATE;
ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "payment_terms_days" INTEGER;
ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "collection_quarter" TEXT;
ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "invoice_date" DATE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "debts_tenant_id_portfolio_id_collection_quarter_idx"
ON "debts"("tenant_id", "portfolio_id", "collection_quarter");
