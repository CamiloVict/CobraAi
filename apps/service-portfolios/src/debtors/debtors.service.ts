import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@cobrai/db";
import type { Debtor } from "@cobrai/db";
import { normalizePhoneE164 } from "@cobrai/utils";
import type { UpdateDebtorDto } from "../debts/dto/debt.dto";
import { ScoringService } from "../ai-scoring/scoring.service";

@Injectable()
export class DebtorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: ScoringService
  ) {}

  async findOne(tenantId: string, id: string) {
    const debtor = await this.prisma.debtor.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        debts: { where: { deletedAt: null }, orderBy: { dueDate: "desc" } },
        consents: true
      }
    });
    if (!debtor) {
      throw new NotFoundException("Deudor no encontrado");
    }
    return debtor;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateDebtorDto
  ): Promise<Debtor> {
    await this.findOne(tenantId, id);
    const addressUpdate =
      dto.address_city || dto.address_country
        ? {
            address: {
              ...(dto.address_city ? { city: dto.address_city } : {}),
              ...(dto.address_country ? { country: dto.address_country } : {})
            }
          }
        : {};

    const email =
      dto.email === undefined
        ? undefined
        : dto.email.trim() === ""
          ? null
          : dto.email.trim();

    const updated = await this.prisma.debtor.update({
      where: { id },
      data: {
        name: dto.name,
        email,
        whatsappOptIn: dto.whatsapp_opt_in,
        phones: dto.phones
          ? dto.phones
              .map((p) => normalizePhoneE164(p))
              .filter((p): p is string => Boolean(p))
          : undefined,
        ...addressUpdate
      }
    });

    await this.scoringService.refreshScoresForDebtor(tenantId, id);
    return updated;
  }

  async upsertForDebt(
    tenantId: string,
    input: {
      name: string;
      external_ref?: string;
      debtor_type?: "person" | "company";
      debtor_tax_id?: string;
      phones?: string[];
      debtor_email?: string;
      whatsapp_opt_in?: boolean;
    }
  ): Promise<Debtor> {
    if (input.debtor_tax_id) {
      const byTax = await this.prisma.debtor.findFirst({
        where: { tenantId, taxId: input.debtor_tax_id, deletedAt: null }
      });
      if (byTax) {
        return byTax;
      }
    }

    if (input.external_ref) {
      const byRef = await this.prisma.debtor.findFirst({
        where: { tenantId, externalRef: input.external_ref, deletedAt: null }
      });
      if (byRef) {
        return byRef;
      }
    }

    const phones = (input.phones ?? [])
      .map((p) => normalizePhoneE164(p))
      .filter((p): p is string => Boolean(p));

    return this.prisma.debtor.create({
      data: {
        tenantId,
        name: input.name,
        externalRef: input.external_ref,
        type: input.debtor_type ?? "person",
        taxId: input.debtor_tax_id,
        phones,
        email: input.debtor_email,
        whatsappOptIn: input.whatsapp_opt_in ?? false
      }
    });
  }
}
