import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn("⚠️  DATABASE_URL not set — Prisma client will not connect");
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === "$connect" || prop === "$disconnect") {
          return () => Promise.resolve();
        }
        if (typeof prop === "string" && !prop.startsWith("_")) {
          console.warn(`⚠️  Database not configured. Attempted to access prisma.${prop}`);
        }
        return undefined;
      },
    });
  }

  const pool = new pg.Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
