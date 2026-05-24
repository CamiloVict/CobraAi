import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import type { AuthenticatedRequest } from "../types/clerk-request";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { method, url } = request;
    const started = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          JSON.stringify({
            request_id: request.requestId,
            method,
            path: url,
            tenant_id: request.clerkOrgId,
            user_id: request.clerkUserId,
            duration_ms: Date.now() - started
          })
        );
      })
    );
  }
}
