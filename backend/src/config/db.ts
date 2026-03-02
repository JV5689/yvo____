import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export default async function connectDb() {
  if (String(process.env.SKIP_DB || "").toLowerCase() === "true") {
    console.log("Skipping DB connection (SKIP_DB=true)");
    return;
  }

  try {
    await prisma.$connect();
    console.log("MySQL Database Connected via Prisma ✅");
  } catch (error) {
    console.error("Prisma Connection Error:", error);
    process.exit(1);
  }
}
