import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequest } from "../types/clerk-request";

export interface CurrentUserContext {
  clerkUserId: string;
  tenantId: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserContext => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return {
      clerkUserId: request.clerkUserId ?? "",
      tenantId: request.clerkOrgId ?? "",
      role: request.clerkOrgRole ?? "viewer"
    };
  }
);
