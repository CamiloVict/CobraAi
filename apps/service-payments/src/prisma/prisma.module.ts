import { Global, Module } from "@nestjs/common";
import { PrismaService } from "@cobrai/db";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
