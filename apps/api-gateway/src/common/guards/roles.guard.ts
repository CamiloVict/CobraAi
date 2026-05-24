import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthenticatedRequest } from "../types/clerk-request";

const ROLE_HIERARCHY: Record<string, number> = {
  admin: 4,
  manager: 3,
  agent: 2,
  viewer: 1
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.getAllAndOverride<string>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRole) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRole = request.clerkOrgRole ?? "viewer";

    const hasPermission =
      (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Rol requerido: ${requiredRole}. Tu rol actual: ${userRole}.`
      );
    }

    return true;
  }
}
