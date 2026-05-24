import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cobrai/db";
import type { CreateTemplateDto } from "./dto/template.dto";

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    return this.prisma.notificationTemplate.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" }
    });
  }

  async create(tenantId: string, dto: CreateTemplateDto) {
    return this.prisma.notificationTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        channel: dto.channel,
        content: dto.content,
        variables: dto.variables ?? [],
        language: dto.language ?? "es",
        isApproved: dto.is_approved ?? false
      }
    });
  }
}
