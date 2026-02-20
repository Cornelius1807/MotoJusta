import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Get or auto-create the UserProfile for the current authenticated user.
 * This handles the case where the Clerk webhook hasn't fired yet
 * (e.g. webhook not configured, or first login before webhook arrives).
 */
export async function getOrCreateProfile() {
  const { userId } = await auth();
  if (!userId) return null;

  // Try to find existing profile
  let profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });

  if (profile) return profile;

  // Profile doesn't exist — auto-create from Clerk user data
  try {
    const user = await currentUser();
    const email =
      user?.emailAddresses?.[0]?.emailAddress || "";
    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      "Usuario";

    profile = await prisma.userProfile.create({
      data: {
        clerkUserId: userId,
        email: email || undefined,
        name,
        role: "MOTOCICLISTA",
      },
    });

    logger.info("Auto-created user profile (webhook missed)", {
      clerkUserId: userId,
      email,
    });

    return profile;
  } catch (err: any) {
    // If there's a unique constraint error, the profile was created
    // between our findUnique and create — just fetch it
    if (err?.code === "P2002") {
      return prisma.userProfile.findUnique({
        where: { clerkUserId: userId },
      });
    }
    logger.error("Failed to auto-create profile", {
      error: String(err),
      clerkUserId: userId,
    });
    throw err;
  }
}
