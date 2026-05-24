import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /** Establece contexto RLS por tenant (PostgreSQL `app.tenant_id`). */
    setTenantContext(tenantId: string): Promise<void>;
}
//# sourceMappingURL=prisma.service.d.ts.map