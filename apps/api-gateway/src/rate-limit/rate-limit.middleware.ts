import {
  HttpException,
  HttpStatus,
  Injectable,
  type NestMiddleware
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../common/types/clerk-request";
import { RateLimitService } from "./rate-limit.service";

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly rateLimit: RateLimitService,
    private readonly config: ConfigService
  ) {}

  async use(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    if (
      req.path === "/" ||
      req.path === "/health" ||
      req.path.startsWith("/api/v1/webhooks/")
    ) {
      next();
      return;
    }

    const ipLimit = Number(
      this.config.get<string>("RATE_LIMIT_IP_PER_MIN") ?? 100
    );
    const ip = req.ip ?? "unknown";
    const ipOk = await this.rateLimit.checkLimit(`ip:${ip}`, ipLimit);
    if (!ipOk) {
      throw new HttpException(
        "Rate limit excedido por IP",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    next();
  }
}
