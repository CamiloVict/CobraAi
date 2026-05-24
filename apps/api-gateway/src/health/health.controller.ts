import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@cobrai/db";
import Redis from "ioredis";
import { Public } from "../common/decorators/public.decorator";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  @Public()
  @Get()
  async check(): Promise<{
    ok: boolean;
    service: string;
    checks: Record<string, string>;
  }> {
    const checks: Record<string, string> = {
      database: "unknown",
      redis: "unknown",
      kafka: "configured"
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = "up";
    } catch {
      checks.database = "down";
    }

    const redisUrl = this.config.get<string>("REDIS_URL");
    if (redisUrl) {
      const redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        lazyConnect: true
      });
      try {
        await redis.connect();
        await redis.ping();
        checks.redis = "up";
        redis.disconnect();
      } catch {
        checks.redis = "down";
      }
    } else {
      checks.redis = "skipped";
    }

    const kafkaBrokers = this.config.get<string>("KAFKA_BROKERS");
    checks.kafka = kafkaBrokers ? "configured" : "skipped";

    const ok = checks.database === "up";

    return {
      ok,
      service: "api-gateway",
      checks
    };
  }
}
