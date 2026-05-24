import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { TenantContextRequest } from "@cobrai/utils";

export interface RequestContext {
  tenantId: string;
  userId?: string;
  userRole?: string;
}

export const ReqContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const req = ctx.switchToHttp().getRequest<TenantContextRequest>();
    return {
      tenantId: req.tenantId ?? "",
      userId: req.userId,
      userRole: req.userRole
    };
  }
);
