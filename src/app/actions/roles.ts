"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateProfile } from "@/lib/get-profile";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

type SwitchableRole = "MOTOCICLISTA" | "TALLER" | "ADMIN";

/**
 * Switch the current user's role (for development/testing).
 * When switching to TALLER, auto-creates a Workshop record if none exists.
 */
export async function switchRole(role: SwitchableRole) {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("No autorizado");

  // Update user role
  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { role },
  });

  // If switching to TALLER, ensure a Workshop record exists
  if (role === "TALLER") {
    const existingWorkshop = await prisma.workshop.findFirst({
      where: { userId: profile.id },
    });
    if (!existingWorkshop) {
      await prisma.workshop.create({
        data: {
          userId: profile.id,
          name: `Taller de ${profile.name || "Usuario"}`,
          district: profile.district || "Lima",
          address: "Dirección pendiente",
          phone: "000-000-0000",
          status: "VERIFICADO",
          rating: 4.5,
        },
      });
      logger.info("Auto-created workshop for role switch", { userId: profile.id });
    }
  }

  logger.info("Role switched", { userId: profile.id, newRole: role });
  revalidatePath("/app");
  revalidatePath("/app/taller");
  revalidatePath("/app/admin");
  return { success: true, role };
}

/**
 * Get the current user's role.
 */
export async function getCurrentRole() {
  const profile = await getOrCreateProfile();
  if (!profile) return null;
  return profile.role;
}
