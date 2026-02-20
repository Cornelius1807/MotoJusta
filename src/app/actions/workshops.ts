"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { workshopRegistrationSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function registerWorkshop(data: {
  name: string;
  district: string;
  address: string;
  phone?: string;
  description?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  const parsed = workshopRegistrationSchema.parse(data);

  const workshop = await prisma.workshop.create({
    data: {
      ...parsed,
      userId: profile.id,
      status: "PENDIENTE",
    },
  });

  // Update user role to WORKSHOP
  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { role: "TALLER" },
  });

  logger.info("Workshop registered", { userId: profile.id, workshopId: workshop.id });
  revalidatePath("/app/taller/perfil");
  return workshop;
}

export async function verifyWorkshop(workshopId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile || profile.role !== "ADMIN") throw new Error("No autorizado - solo admin");

  const workshop = await prisma.workshop.update({
    where: { id: workshopId },
    data: {
      status: "VERIFICADO",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: profile.id,
      action: "VERIFICAR_TALLER",
      targetType: "WORKSHOP",
      targetId: workshopId,
    },
  });

  logger.audit(profile.id, "VERIFY_WORKSHOP", workshopId);
  revalidatePath("/app/admin/talleres");
  return workshop;
}

export async function suspendWorkshop(workshopId: string, reason: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile || profile.role !== "ADMIN") throw new Error("No autorizado - solo admin");

  const workshop = await prisma.workshop.update({
    where: { id: workshopId },
    data: { status: "SUSPENDIDO" },
  });

  await prisma.auditLog.create({
    data: {
      actorId: profile.id,
      action: "SUSPENDER_TALLER",
      targetType: "WORKSHOP",
      targetId: workshopId,
      reason,
    },
  });

  logger.audit(profile.id, "SUSPEND_WORKSHOP", workshopId, { reason });
  revalidatePath("/app/admin/talleres");
  return workshop;
}
