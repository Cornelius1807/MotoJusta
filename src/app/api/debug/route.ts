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

  // 4. Test creating + deleting a motorcycle for the real user
  try {
    const { prisma } = await import("@/lib/prisma");
    const realUser = await prisma.userProfile.findFirst({
      where: { email: "mmatiasac18@gmail.com" },
    });
    if (realUser) {
      const testMoto = await prisma.motorcycle.create({
        data: {
          brand: "Test",
          model: "Debug",
          year: 2025,
          userId: realUser.id,
        },
      });
      diagnostics.createMotorcycleTest = {
        status: "OK",
        created: { id: testMoto.id, brand: testMoto.brand },
      };
      // Clean up
      await prisma.motorcycle.delete({ where: { id: testMoto.id } });
      diagnostics.createMotorcycleTest.deleted = true;
    } else {
      diagnostics.createMotorcycleTest = { status: "NO_USER_FOUND" };
    }
  } catch (err: any) {
    diagnostics.createMotorcycleTest = {
      status: "ERROR",
      message: err.message,
      code: err.code,
      meta: err.meta,
      stack: err.stack?.split("\n").slice(0, 8),
    };
  }

  // 5. Test auth() import (will fail without request context but shows if module loads)
  try {
    const { auth } = await import("@clerk/nextjs/server");
    diagnostics.clerkAuth = { status: "MODULE_LOADED" };
    try {
      const result = await auth();
      diagnostics.clerkAuth.result = {
        userId: result.userId,
        sessionId: result.sessionId,
      };
    } catch (authErr: any) {
      diagnostics.clerkAuth.callError = authErr.message;
    }
  } catch (err: any) {
    diagnostics.clerkAuth = {
      status: "IMPORT_ERROR",
      message: err.message,
    };
  }

  // 6. Check Clerk config
  diagnostics.clerk = {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      ? `${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 20)}...`
      : "NOT SET",
    secretKey: process.env.CLERK_SECRET_KEY ? "SET" : "NOT SET",
    isDevKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_"),
  };

  // 7. Check BLOB token
  diagnostics.blob = {
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? "SET" : "NOT SET",
  };

  return NextResponse.json(diagnostics, { status: 200 });
}
