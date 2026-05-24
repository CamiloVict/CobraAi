import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@cobrai/db";
import { decimalToNumber } from "../common/utils/api.utils";

@Injectable()
export class PaymentEventsService {
  private readonly logger = new Logger(PaymentEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handlePaymentConfirmed(
    tenantId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const debtId = String(payload.debt_id ?? "");
    if (!debtId) return;

    const amount = Number(payload.amount ?? 0);
    const debt = await this.prisma.debt.findFirst({
      where: { id: debtId, tenantId, deletedAt: null }
    });
    if (!debt) {
      this.logger.warn(`Deuda ${debtId} no encontrada para pago confirmado`);
      return;
    }

    const outstandingBefore = decimalToNumber(debt.amountOutstanding);
    const outstandingAfter =
      payload.amount_outstanding !== undefined
        ? Number(payload.amount_outstanding)
        : Math.max(0, outstandingBefore - amount);

    const status = outstandingAfter <= 0 ? "paid_full" : "paid_partial";

    await this.prisma.debt.update({
      where: { id: debt.id },
      data: {
        amountOutstanding: outstandingAfter,
        status
      }
    });

    this.logger.log(
      `Deuda ${debtId} actualizada: outstanding=${outstandingAfter} status=${status}`
    );
  }
}
