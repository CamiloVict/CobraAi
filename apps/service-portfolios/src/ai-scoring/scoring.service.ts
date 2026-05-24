import { Inject, Injectable } from "@nestjs/common";
import type { Debt, Debtor } from "@cobrai/db";
import type { AIScoringPort, ScoringResult } from "@cobrai/ports";
import { AI_SCORING_PORT } from "./stub-ai-scoring.adapter";
import { computeAgingDays, decimalToNumber } from "../common/utils/api.utils";

@Injectable()
export class ScoringService {
  constructor(
    @Inject(AI_SCORING_PORT) private readonly scoringPort: AIScoringPort
  ) {}

  async scoreDebtRecord(
    tenantId: string,
    debt: Debt,
    debtor: Debtor
  ): Promise<ScoringResult> {
    const phones = Array.isArray(debtor.phones) ? (debtor.phones as string[]) : [];
    const agingDays = computeAgingDays(debt.dueDate);

    return this.scoringPort.scoreDebt({
      debt_id: debt.id,
      tenant_id: tenantId,
      features: {
        aging_days: agingDays,
        amount: decimalToNumber(debt.amountOriginal),
        amount_outstanding: decimalToNumber(debt.amountOutstanding),
        has_whatsapp: debtor.whatsappOptIn,
        has_phone: phones.length > 0,
        has_email: Boolean(debtor.email),
        promises_broken_count: 0,
        previous_contacts_count: 0
      }
    });
  }
}
