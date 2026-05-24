import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Observable } from "rxjs";
import type { AuthenticatedRequest } from "../types/clerk-request";

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const incoming = request.headers["x-request-id"];
    const requestId =
      (Array.isArray(incoming) ? incoming[0] : incoming) ?? randomUUID();

    request.requestId = requestId;
    request.headers["x-request-id"] = requestId;

    return next.handle();
  }
}
