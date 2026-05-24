import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService, type Prisma } from "@cobrai/db";

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  assertAdmin(role?: string): void {
    if (role !== "admin") {
      throw new ForbiddenException("Solo administradores pueden acceder a auditoría");
    }
  }

  async list(tenantId: string, query: Record<string, unknown>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 50)));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      deletedAt: null,
      ...(query.user_id ? { userId: String(query.user_id) } : {}),
      ...(query.action
        ? { action: { contains: String(query.action), mode: "insensitive" } }
        : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(String(query.from)) } : {}),
              ...(query.to ? { lte: new Date(String(query.to)) } : {})
            }
          }
        : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } }
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return { items, total, page, limit };
  }

  async exportCsv(tenantId: string, query: Record<string, unknown>): Promise<string> {
    const { items } = await this.list(tenantId, { ...query, limit: 1000, page: 1 });
    const header = "fecha,usuario,accion,recurso,resource_id,ip\n";
    const rows = items
      .map((row) =>
        [
          row.createdAt.toISOString(),
          row.user?.email ?? row.userId ?? "",
          row.action,
          row.resourceType,
          row.resourceId,
          row.ipAddress ?? ""
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    return header + rows;
  }
}
