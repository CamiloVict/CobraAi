-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "tenant_plan" AS ENUM ('trial', 'growth', 'enterprise');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'manager', 'agent', 'viewer');

-- CreateEnum
CREATE TYPE "portfolio_status" AS ENUM ('active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "debtor_type" AS ENUM ('person', 'company');

-- CreateEnum
CREATE TYPE "contact_channel" AS ENUM ('whatsapp', 'voice', 'email', 'sms', 'portal');

-- CreateEnum
CREATE TYPE "risk_segment" AS ENUM ('critical', 'high', 'medium', 'low', 'minimal');

-- CreateEnum
CREATE TYPE "aging_bucket" AS ENUM ('d0_30', 'd31_60', 'd61_90', 'd91_180', 'd180_plus');

-- CreateEnum
CREATE TYPE "debt_status" AS ENUM ('new', 'analyzing', 'active', 'contacted', 'promised', 'plan', 'disputed', 'legal_risk', 'legal', 'paid_partial', 'paid_full', 'written_off');

-- CreateEnum
CREATE TYPE "contact_status" AS ENUM ('scheduled', 'in_progress', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "contact_outcome" AS ENUM ('promise_made', 'payment_received', 'no_answer', 'refused', 'voicemail', 'wrong_number', 'callback_requested');

-- CreateEnum
CREATE TYPE "agent_type" AS ENUM ('ai', 'human');

-- CreateEnum
CREATE TYPE "promise_status" AS ENUM ('pending', 'kept', 'broken', 'partial');

-- CreateEnum
CREATE TYPE "payment_gateway" AS ENUM ('pix', 'spei', 'pse', 'mercadopago', 'conekta', 'card', 'transfer', 'cash');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'confirmed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "payment_link_status" AS ENUM ('active', 'used', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "conversation_status" AS ENUM ('open', 'closed', 'archived', 'pending');

-- CreateEnum
CREATE TYPE "message_direction" AS ENUM ('in', 'out');

-- CreateEnum
CREATE TYPE "message_status" AS ENUM ('sent', 'delivered', 'read', 'failed');

-- CreateEnum
CREATE TYPE "consent_source" AS ENUM ('web', 'import', 'agent', 'api', 'opt_in_message');

-- CreateEnum
CREATE TYPE "workflow_trigger" AS ENUM ('debt_created', 'debt_updated', 'score_updated', 'promise_broken', 'payment_confirmed', 'schedule', 'manual');

-- CreateEnum
CREATE TYPE "workflow_action" AS ENUM ('send_notification', 'escalate_human', 'update_status', 'assign_strategy', 'create_task');

-- CreateEnum
CREATE TYPE "workflow_execution_status" AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "tenant_plan" NOT NULL DEFAULT 'trial',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "password_hash" TEXT NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "portfolio_status" NOT NULL DEFAULT 'active',
    "total_debts" INTEGER NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'COP',
    "imported_at" TIMESTAMP(3),
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debtors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "external_ref" TEXT,
    "name" TEXT NOT NULL,
    "type" "debtor_type" NOT NULL DEFAULT 'person',
    "tax_id" TEXT,
    "phones" JSONB NOT NULL DEFAULT '[]',
    "email" TEXT,
    "address" JSONB NOT NULL DEFAULT '{}',
    "whatsapp_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "emotional_profile" JSONB,
    "best_channel" "contact_channel",
    "best_contact_time" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "debtors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "portfolio_id" UUID NOT NULL,
    "debtor_id" UUID NOT NULL,
    "external_ref" TEXT,
    "amount_original" DECIMAL(15,2) NOT NULL,
    "amount_outstanding" DECIMAL(15,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'COP',
    "due_date" DATE NOT NULL,
    "aging_bucket" "aging_bucket" NOT NULL,
    "status" "debt_status" NOT NULL DEFAULT 'new',
    "ai_score" INTEGER,
    "ai_segment" "risk_segment",
    "risk_level" "risk_segment",
    "best_channel" "contact_channel",
    "strategy_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "debt_id" UUID NOT NULL,
    "debtor_id" UUID NOT NULL,
    "channel" "contact_channel" NOT NULL,
    "status" "contact_status" NOT NULL DEFAULT 'scheduled',
    "outcome" "contact_outcome",
    "sentiment_score" DOUBLE PRECISION,
    "transcript_url" TEXT,
    "duration_seconds" INTEGER,
    "agent_type" "agent_type" NOT NULL DEFAULT 'ai',
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promises_to_pay" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "debt_id" UUID NOT NULL,
    "contact_id" UUID,
    "amount" DECIMAL(15,2) NOT NULL,
    "promised_date" DATE NOT NULL,
    "status" "promise_status" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "promises_to_pay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "debt_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'COP',
    "gateway" "payment_gateway" NOT NULL,
    "gateway_ref" TEXT,
    "status" "payment_status" NOT NULL DEFAULT 'pending',
    "idempotency_key" TEXT NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "debt_id" UUID NOT NULL,
    "token" UUID NOT NULL DEFAULT gen_random_uuid(),
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'COP',
    "gateway" "payment_gateway" NOT NULL,
    "status" "payment_link_status" NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "payment_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payment_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "debtor_id" UUID NOT NULL,
    "debt_id" UUID,
    "channel" "contact_channel" NOT NULL,
    "status" "conversation_status" NOT NULL DEFAULT 'open',
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "direction" "message_direction" NOT NULL,
    "channel" "contact_channel" NOT NULL,
    "content" TEXT NOT NULL,
    "status" "message_status" NOT NULL DEFAULT 'sent',
    "template_id" UUID,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "contact_channel" NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'es',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_consents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "debtor_id" UUID NOT NULL,
    "channel" "contact_channel" NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "source" "consent_source" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contact_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "workflow_trigger" NOT NULL,
    "condition" JSONB NOT NULL DEFAULT '{}',
    "action" "workflow_action" NOT NULL,
    "channel" "contact_channel",
    "delay_hours" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workflow_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "debt_id" UUID NOT NULL,
    "rule_id" UUID NOT NULL,
    "status" "workflow_execution_status" NOT NULL DEFAULT 'pending',
    "executed_at" TIMESTAMP(3),
    "result" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID NOT NULL,
    "changes" JSONB NOT NULL DEFAULT '{}',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "portfolios_tenant_id_status_idx" ON "portfolios"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "debtors_tenant_id_idx" ON "debtors"("tenant_id");

-- CreateIndex
CREATE INDEX "debtors_tenant_id_tax_id_idx" ON "debtors"("tenant_id", "tax_id");

-- CreateIndex
CREATE UNIQUE INDEX "debtors_tenant_id_external_ref_key" ON "debtors"("tenant_id", "external_ref");

-- CreateIndex
CREATE INDEX "debts_tenant_id_status_idx" ON "debts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "debts_tenant_id_ai_score_idx" ON "debts"("tenant_id", "ai_score");

-- CreateIndex
CREATE INDEX "debts_tenant_id_portfolio_id_idx" ON "debts"("tenant_id", "portfolio_id");

-- CreateIndex
CREATE INDEX "debts_tenant_id_debtor_id_idx" ON "debts"("tenant_id", "debtor_id");

-- CreateIndex
CREATE INDEX "contacts_tenant_id_debt_id_idx" ON "contacts"("tenant_id", "debt_id");

-- CreateIndex
CREATE INDEX "contacts_tenant_id_debtor_id_idx" ON "contacts"("tenant_id", "debtor_id");

-- CreateIndex
CREATE INDEX "promises_to_pay_tenant_id_debt_id_idx" ON "promises_to_pay"("tenant_id", "debt_id");

-- CreateIndex
CREATE INDEX "promises_to_pay_tenant_id_status_idx" ON "promises_to_pay"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_ref_key" ON "payments"("gateway_ref");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_tenant_id_debt_id_idx" ON "payments"("tenant_id", "debt_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_status_idx" ON "payments"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_links_token_key" ON "payment_links"("token");

-- CreateIndex
CREATE INDEX "payment_links_tenant_id_debt_id_idx" ON "payment_links"("tenant_id", "debt_id");

-- CreateIndex
CREATE INDEX "payment_links_tenant_id_status_idx" ON "payment_links"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "conversations_tenant_id_debtor_id_idx" ON "conversations"("tenant_id", "debtor_id");

-- CreateIndex
CREATE INDEX "conversations_tenant_id_status_idx" ON "conversations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_tenant_id_idx" ON "messages"("tenant_id");

-- CreateIndex
CREATE INDEX "notification_templates_tenant_id_channel_idx" ON "notification_templates"("tenant_id", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_tenant_id_name_channel_key" ON "notification_templates"("tenant_id", "name", "channel");

-- CreateIndex
CREATE INDEX "contact_consents_tenant_id_debtor_id_channel_idx" ON "contact_consents"("tenant_id", "debtor_id", "channel");

-- CreateIndex
CREATE INDEX "workflow_rules_tenant_id_is_active_idx" ON "workflow_rules"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "workflow_executions_tenant_id_debt_id_idx" ON "workflow_executions"("tenant_id", "debt_id");

-- CreateIndex
CREATE INDEX "workflow_executions_tenant_id_rule_id_idx" ON "workflow_executions"("tenant_id", "rule_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_resource_type_resource_id_idx" ON "audit_logs"("tenant_id", "resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debtors" ADD CONSTRAINT "debtors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_debtor_id_fkey" FOREIGN KEY ("debtor_id") REFERENCES "debtors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_debtor_id_fkey" FOREIGN KEY ("debtor_id") REFERENCES "debtors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promises_to_pay" ADD CONSTRAINT "promises_to_pay_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promises_to_pay" ADD CONSTRAINT "promises_to_pay_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promises_to_pay" ADD CONSTRAINT "promises_to_pay_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_debtor_id_fkey" FOREIGN KEY ("debtor_id") REFERENCES "debtors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_consents" ADD CONSTRAINT "contact_consents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_consents" ADD CONSTRAINT "contact_consents_debtor_id_fkey" FOREIGN KEY ("debtor_id") REFERENCES "debtors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_rules" ADD CONSTRAINT "workflow_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "workflow_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

