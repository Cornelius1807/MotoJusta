import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
  };

  // 1. Test basic Prisma connection
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.category.count();
    diagnostics.prismaBasic = { status: "OK", categoryCount: count };
  } catch (err: any) {
    diagnostics.prismaBasic = {
      status: "ERROR",
      message: err.message,
      stack: err.stack?.split("\n").slice(0, 8),
    };
  }

  // 2. Test UserProfile table
  try {
    const { prisma } = await import("@/lib/prisma");
    const profiles = await prisma.userProfile.findMany({ take: 5 });
    diagnostics.userProfiles = {
      status: "OK",
      count: profiles.length,
      sample: profiles.map((p: any) => ({
        id: p.id,
        clerkUserId: p.clerkUserId,
        email: p.email,
        role: p.role,
      })),
    };
  } catch (err: any) {
    diagnostics.userProfiles = {
      status: "ERROR",
      message: err.message,
      stack: err.stack?.split("\n").slice(0, 8),
    };
  }

  // 3. Test Motorcycle table
  try {
    const { prisma } = await import("@/lib/prisma");
    const motos = await prisma.motorcycle.findMany({ take: 5 });
    diagnostics.motorcycles = {
      status: "OK",
      count: motos.length,
      sample: motos.map((m: any) => ({
        id: m.id,
        brand: m.brand,
        model: m.model,
        userId: m.userId,
      })),
    };
  } catch (err: any) {
    diagnostics.motorcycles = {
      status: "ERROR",
      message: err.message,
      stack: err.stack?.split("\n").slice(0, 8),
    };
  }

  // 4. Check Clerk config
  diagnostics.clerk = {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      ? `${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 20)}...`
      : "NOT SET",
    secretKey: process.env.CLERK_SECRET_KEY ? "SET" : "NOT SET",
    isDevKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_"),
  };

  // 5. Check BLOB token
  diagnostics.blob = {
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? "SET" : "NOT SET",
  };

  // 6. Test the full getOrCreateProfile flow (without auth, just show what would happen)
  diagnostics.schemaInfo = {};
  try {
    const { prisma } = await import("@/lib/prisma");
    // Check what columns exist on UserProfile
    const result = await (prisma as any).$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'UserProfile'
      ORDER BY ordinal_position`;
    diagnostics.schemaInfo.UserProfile = result;
  } catch (err: any) {
    diagnostics.schemaInfo.UserProfile = {
      error: err.message,
    };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const result = await (prisma as any).$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Motorcycle'
      ORDER BY ordinal_position`;
    diagnostics.schemaInfo.Motorcycle = result;
  } catch (err: any) {
    diagnostics.schemaInfo.Motorcycle = {
      error: err.message,
    };
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
