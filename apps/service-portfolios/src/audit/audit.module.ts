import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AuditInterceptor } from "./audit.interceptor";
import { AuditLogsController } from "./audit-logs.controller";
import { AuditLogsService } from "./audit-logs.service";

@Module({
  controllers: [AuditLogsController],
  providers: [
    AuditLogsService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }
  ]
})
export class AuditModule {}
