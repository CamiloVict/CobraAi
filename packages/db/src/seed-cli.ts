import { PrismaClient } from "@prisma/client";
import { runSeed } from "./seed";

const prisma = new PrismaClient();

runSeed()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
