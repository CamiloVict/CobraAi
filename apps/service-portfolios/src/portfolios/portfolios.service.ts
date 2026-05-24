import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@cobrai/db";
import type { Portfolio } from "@cobrai/db";
import {
  getCollectionQuarter,
  getQuarterLabel,
  getQuarterPipelineStatus,
  isActiveDebt
} from "@cobrai/utils";
import {
  decimalToNumber,
  parseFilters,
  parsePagination,
  parseSort
} from "../common/utils/api.utils";
import type { CreatePortfolioDto, UpdatePortfolioDto } from "./dto/portfolio.dto";

@Injectable()
export class PortfoliosService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    tenantId: string,
    query: Record<string, unknown>
  ): Promise<{ items: Portfolio[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query);
    const filters = parseFilters(query);
    const { field, direction } = parseSort(query.sort, [
      "created_at",
      "name",
      "total_amount"
    ]);

    const orderBy =
      field === "created_at"
        ? { createdAt: direction }
        : field === "name"
          ? { name: direction }
          : { totalAmount: direction };

    const where = {
      tenantId,
      deletedAt: null,
      ...(filters.status ? { status: filters.status as never } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.portfolio.findMany({ where, skip, take: limit, orderBy }),
      this.prisma.portfolio.count({ where })
    ]);

    return { items, total, page, limit };
  }

  async create(tenantId: string, dto: CreatePortfolioDto): Promise<Portfolio> {
    return this.prisma.portfolio.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        currency: dto.currency ?? "COP"
      }
    });
  }

  async findOne(tenantId: string, id: string): Promise<Portfolio> {
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id, tenantId, deletedAt: null }
    });
    if (!portfolio) {
      throw new NotFoundException("Portafolio no encontrado");
    }
    return portfolio;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePortfolioDto
  ): Promise<Portfolio> {
    await this.findOne(tenantId, id);
    return this.prisma.portfolio.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status
      }
    });
  }

  async softDelete(tenantId: string, id: string): Promise<Portfolio> {
    await this.findOne(tenantId, id);
    return this.prisma.portfolio.update({
      where: { id },
      data: { deletedAt: new Date(), status: "archived" }
    });
  }

  async stats(tenantId: string, id: string): Promise<Record<string, unknown>> {
    await this.findOne(tenantId, id);

    const debts = await this.prisma.debt.findMany({
      where: { tenantId, portfolioId: id, deletedAt: null },
      select: {
        status: true,
        agingBucket: true,
        amountOriginal: true,
        amountOutstanding: true,
        collectionQuarter: true,
        dueDate: true,
        scheduledCollectionDate: true
      }
    });

    const activeDebts = debts.filter((d) => isActiveDebt(d.status));
    const totalActiveAmount = activeDebts.reduce(
      (sum, d) => sum + decimalToNumber(d.amountOutstanding),
      0
    );
    const totalPortfolioAmount = debts.reduce(
      (sum, d) => sum + decimalToNumber(d.amountOriginal),
      0
    );

    const recoveredAmount = debts
      .filter((d) => d.status === "paid_full" || d.status === "paid_partial")
      .reduce((sum, d) => sum + decimalToNumber(d.amountOriginal), 0);

    const collectableOriginal = activeDebts.reduce(
      (sum, d) => sum + decimalToNumber(d.amountOriginal),
      0
    );
    const recoveryRate =
      collectableOriginal > 0 ? recoveredAmount / collectableOriginal : 0;

    const overdueActive = activeDebts.filter(
      (d) => !["future", "upcoming"].includes(d.status)
    );
    const dsoAverage =
      overdueActive.length > 0
        ? overdueActive.reduce((sum, d) => {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const due = new Date(d.dueDate);
            due.setUTCHours(0, 0, 0, 0);
            const days = Math.max(
              0,
              Math.floor((today.getTime() - due.getTime()) / 86_400_000)
            );
            return sum + days;
          }, 0) / overdueActive.length
        : 0;

    const quarterMap = new Map<
      string,
      {
        statuses: string[];
        amount: number;
        debts_count: number;
        recovered: number;
        aging: Record<string, number>;
      }
    >();

    for (const debt of debts) {
      const quarter =
        debt.collectionQuarter ??
        getCollectionQuarter(debt.scheduledCollectionDate ?? debt.dueDate);
      const entry = quarterMap.get(quarter) ?? {
        statuses: [],
        amount: 0,
        debts_count: 0,
        recovered: 0,
        aging: {}
      };
      entry.statuses.push(debt.status);
      entry.amount += decimalToNumber(debt.amountOriginal);
      entry.debts_count += 1;
      if (debt.status === "paid_full" || debt.status === "paid_partial") {
        entry.recovered += decimalToNumber(debt.amountOriginal);
      }
      if (isActiveDebt(debt.status) && debt.agingBucket) {
        entry.aging[debt.agingBucket] =
          (entry.aging[debt.agingBucket] ?? 0) + 1;
      }
      quarterMap.set(quarter, entry);
    }

    const quarters = [...quarterMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, data]) => {
        const pipelineStatus = getQuarterPipelineStatus(
          data.statuses as never[]
        );
        const quarterRecovery =
          data.amount > 0 ? data.recovered / data.amount : 0;
        return {
          quarter,
          label: getQuarterLabel(quarter),
          amount: data.amount,
          debts_count: data.debts_count,
          status: pipelineStatus,
          recovered: data.recovered,
          recovery_rate: quarterRecovery,
          aging_summary:
            pipelineStatus === "active" ? data.aging : null
        };
      });

    return {
      portfolio_id: id,
      total_active_amount: totalActiveAmount,
      total_active_debts: activeDebts.length,
      recovery_rate: recoveryRate,
      dso_average: Math.round(dsoAverage),
      recovered_amount: recoveredAmount,
      total_portfolio_amount: totalPortfolioAmount,
      total_portfolio_debts: debts.length,
      quarters,
      by_aging: Object.entries(
        activeDebts.reduce<Record<string, number>>((acc, d) => {
          acc[d.agingBucket] = (acc[d.agingBucket] ?? 0) + 1;
          return acc;
        }, {})
      ).map(([bucket, count]) => ({ bucket, count }))
    };
  }
}
