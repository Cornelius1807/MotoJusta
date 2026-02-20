"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateProfile } from "@/lib/get-profile";
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
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("No autorizado");

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
  const profile = await getOrCreateProfile();
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

export async function getWorkshops() {
  const profile = await getOrCreateProfile();
  if (!profile || profile.role !== "ADMIN") throw new Error("No autorizado - solo admin");
  return prisma.workshop.findMany({
    include: {
      user: { select: { name: true, email: true } },
      categories: { include: { category: true } },
      _count: { select: { reviews: true, workOrders: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkshopProfile() {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("No autorizado");

  const workshop = await prisma.workshop.findFirst({
    where: { userId: profile.id },
    include: {
      categories: { include: { category: true } },
    },
  });

  return workshop;
}

export async function suspendWorkshop(workshopId: string, reason: string) {
  const profile = await getOrCreateProfile();
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

// --- HU-25: Public workshop profile (no auth required for reading) ---
export async function getPublicWorkshopProfile(workshopId: string) {
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    include: {
      categories: { include: { category: true } },
      reviews: {
        include: {
          user: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!workshop || workshop.status !== "VERIFICADO") {
    return null;
  }

  return {
    id: workshop.id,
    name: workshop.name,
    district: workshop.district,
    address: workshop.address,
    description: workshop.description,
    photoUrl: workshop.photoUrl,
    rating: workshop.rating,
    totalServices: workshop.totalServices,
    evidenceRate: workshop.evidenceRate,
    guaranteePolicy: workshop.guaranteePolicy,
    categories: workshop.categories.map((wc) => ({
      id: wc.category.id,
      name: wc.category.name,
      slug: wc.category.slug,
    })),
    reviews: workshop.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      userName: r.user.name || "Motociclista",
      userAvatar: r.user.avatarUrl,
      createdAt: r.createdAt,
    })),
  };
}
