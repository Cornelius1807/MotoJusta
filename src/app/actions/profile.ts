"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateProfile } from "@/lib/get-profile";
import { userProfileSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function getProfile() {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("No autorizado");

  return prisma.userProfile.findUnique({
    where: { id: profile.id },
    include: { workshop: true },
  });
}

export async function updateProfile(data: {
  name: string;
  district: string;
  notifChannel?: string;
}) {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("No autorizado");

  const parsed = userProfileSchema.parse(data);

  const updated = await prisma.userProfile.update({
    where: { clerkUserId: profile.clerkUserId },
    data: {
      name: parsed.name,
      district: parsed.district,
      notifChannel: (parsed.notifChannel || "IN_APP") as any,
    },
  });

  logger.info("Profile updated", { userId: updated.id });
  revalidatePath("/app/perfil");
  return updated;
}

export async function acceptTerms() {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("No autorizado");

  const updated = await prisma.userProfile.update({
    where: { clerkUserId: profile.clerkUserId },
    data: {
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  logger.info("Terms accepted", { userId: updated.id });
  revalidatePath("/app");
  return updated;
}
