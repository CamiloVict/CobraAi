-- Clerk org/user IDs are strings (org_xxx, user_xxx), not UUIDs.

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_tenant_id_fkey";
ALTER TABLE "portfolios" DROP CONSTRAINT IF EXISTS "portfolios_created_by_fkey";
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_user_id_fkey";

ALTER TABLE "tenants" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "tenants" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;

ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;
ALTER TABLE "users" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

ALTER TABLE "portfolios" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "portfolios" ALTER COLUMN "created_by" SET DATA TYPE TEXT USING "created_by"::TEXT;

ALTER TABLE "debtors" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "debts" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "contacts" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "promises_to_pay" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "payments" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "payment_links" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "conversations" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "messages" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "notification_templates" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "contact_consents" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "workflow_rules" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "workflow_executions" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "audit_logs" ALTER COLUMN "tenant_id" SET DATA TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "audit_logs" ALTER COLUMN "user_id" SET DATA TYPE TEXT USING "user_id"::TEXT;

ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
