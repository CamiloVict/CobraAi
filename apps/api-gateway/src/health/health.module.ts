import { Module } from "@nestjs/common";
import { PrismaService } from "@cobrai/db";
import { HealthController } from "./health.controller";
import { RootController } from "./root.controller";

@Module({
  controllers: [RootController, HealthController],
  providers: [PrismaService]
})
export class HealthModule {}
