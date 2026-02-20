import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
  };

  // 1. Test auth() - this is the critical test
  try {
    const authResult = await auth();
    diagnostics.auth = {
      status: "OK",
      userId: authResult.userId,
      sessionId: authResult.sessionId ? "SET" : null,
    };
  } catch (err: any) {
    diagnostics.auth = {
      status: "ERROR",
      message: err.message,
      name: err.constructor?.name,
      stack: err.stack?.split("\n").slice(0, 5),
    };
  }

  // 2. Test currentUser()
  try {
    const user = await currentUser();
    diagnostics.currentUser = user
      ? {
          status: "OK",
          id: user.id,
          firstName: user.firstName,
          email: user.emailAddresses?.[0]?.emailAddress,
        }
      : { status: "NO_USER" };
  } catch (err: any) {
    diagnostics.currentUser = {
      status: "ERROR",
      message: err.message,
    };
  }

  // 3. Test getOrCreateProfile
  try {
    const { getOrCreateProfile } = await import("@/lib/get-profile");
    const profile = await getOrCreateProfile();
    diagnostics.getOrCreateProfile = profile
      ? {
          status: "OK",
          id: profile.id,
          clerkUserId: profile.clerkUserId,
          email: profile.email,
          role: profile.role,
        }
      : { status: "NULL_PROFILE" };
  } catch (err: any) {
    diagnostics.getOrCreateProfile = {
      status: "ERROR",
      message: err.message,
      name: err.constructor?.name,
      code: (err as any).code,
      stack: err.stack?.split("\n").slice(0, 8),
    };
  }

  // 4. Test getMotorcycles
  try {
    const { getMotorcycles } = await import("@/app/actions/motorcycles");
    const motos = await getMotorcycles();
    diagnostics.getMotorcycles = {
      status: "OK",
      count: motos.length,
      motos: motos.map((m: any) => ({
        id: m.id,
        brand: m.brand,
        model: m.model,
      })),
    };
  } catch (err: any) {
    diagnostics.getMotorcycles = {
      status: "ERROR",
      message: err.message,
      name: err.constructor?.name,
      code: (err as any).code,
      stack: err.stack?.split("\n").slice(0, 8),
    };
  }

  // 5. Test basic Prisma
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.category.count();
    diagnostics.prisma = { status: "OK", categoryCount: count };
  } catch (err: any) {
    diagnostics.prisma = { status: "ERROR", message: err.message };
  }

  // 6. Env info
  diagnostics.env = {
    clerkPubKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      ? `${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 20)}...`
      : "NOT SET",
    isDevKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_"),
    blobToken: process.env.BLOB_READ_WRITE_TOKEN ? "SET" : "NOT SET",
  };

  return NextResponse.json(diagnostics, { status: 200 });
}
