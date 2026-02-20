import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : "NOT SET",
      POSTGRES_URL: process.env.POSTGRES_URL ? `${process.env.POSTGRES_URL.substring(0, 30)}...` : "NOT SET",
      POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? "SET" : "NOT SET",
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? "SET" : "NOT SET",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "SET" : "NOT SET",
    },
  };

  // Test Neon connection
  try {
    const { Pool } = await import("@neondatabase/serverless");
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const pool = new Pool({ connectionString: dbUrl });
      const result = await pool.query("SELECT 1 as test");
      diagnostics.neonPool = { status: "OK", result: result.rows };
      await pool.end();
    } else {
      diagnostics.neonPool = { status: "NO DATABASE_URL" };
    }
  } catch (err: any) {
    diagnostics.neonPool = {
      status: "ERROR",
      message: err.message,
      name: err.constructor?.name,
      stack: err.stack?.split("\n").slice(0, 5),
    };
  }

  // Test Prisma
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.category.count();
    diagnostics.prisma = { status: "OK", categoryCount: count };
  } catch (err: any) {
    diagnostics.prisma = {
      status: "ERROR",
      message: err.message,
      name: err.constructor?.name,
      stack: err.stack?.split("\n").slice(0, 5),
    };
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
