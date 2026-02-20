"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { userProfileSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function getProfile() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  return prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    include: { workshop: true },
  });
}

export async function updateProfile(data: {
  name: string;
  district: string;
  notifChannel?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const parsed = userProfileSchema.parse(data);

  const profile = await prisma.userProfile.update({
    where: { clerkUserId: userId },
    data: {
      name: parsed.name,
      district: parsed.district,
      notifChannel: (parsed.notifChannel || "IN_APP") as any,
    },
  });

  logger.info("Profile updated", { userId: profile.id });
  revalidatePath("/app/perfil");
  return profile;
}

export async function acceptTerms() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.update({
    where: { clerkUserId: userId },
    data: {
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  logger.info("Terms accepted", { userId: profile.id });
  revalidatePath("/app");
  return profile;
}
