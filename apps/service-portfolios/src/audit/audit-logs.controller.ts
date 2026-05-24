import { Controller, Get, Header, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { successResponse } from "../common/utils/api.utils";
import {
  ReqContext,
  type RequestContext
} from "../common/decorators/request-context.decorator";
import { AuditLogsService } from "./audit-logs.service";

@Controller("v1/audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogs: AuditLogsService) {}

  @Get()
  async list(
    @ReqContext() ctx: RequestContext,
    @Query() query: Record<string, unknown>
  ) {
    this.auditLogs.assertAdmin(ctx.userRole);
    const result = await this.auditLogs.list(ctx.tenantId, query);
    return successResponse({
      items: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / result.limit)
      }
    });
  }

  @Get("export")
  @Header("Content-Type", "text/csv; charset=utf-8")
  async exportCsv(
    @ReqContext() ctx: RequestContext,
    @Query() query: Record<string, unknown>,
    @Res() res: Response
  ): Promise<void> {
    this.auditLogs.assertAdmin(ctx.userRole);
    const csv = await this.auditLogs.exportCsv(ctx.tenantId, query);
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="audit-logs.csv"'
    );
    res.send(csv);
  }
}
