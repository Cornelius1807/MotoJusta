import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn("⚠️  DATABASE_URL not set — Prisma client will not connect");
    // Return a proxy that logs warnings for any DB access
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

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
