import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@cobrai/db";
import type { Portfolio } from "@cobrai/db";
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

    const byAging = await this.prisma.debt.groupBy({
      by: ["agingBucket"],
      where: { tenantId, portfolioId: id, deletedAt: null },
      _count: { _all: true },
      _sum: { amountOutstanding: true }
    });

    const byStatus = await this.prisma.debt.groupBy({
      by: ["status"],
      where: { tenantId, portfolioId: id, deletedAt: null },
      _count: { _all: true }
    });

    return {
      portfolio_id: id,
      by_aging: byAging.map((row) => ({
        bucket: row.agingBucket,
        count: row._count._all,
        amount_outstanding: decimalToNumber(row._sum.amountOutstanding)
      })),
      by_status: byStatus.map((row) => ({
        status: row.status,
        count: row._count._all
      }))
    };
  }
}
