"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateProfile } from "@/lib/get-profile";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function registerWorkshop(data: {
  contactName?: string;
  contactEmail?: string;
  name: string;
  district: string;
  address: string;
  phone: string;
  ruc?: string;
  description?: string;
  guaranteePolicy?: string;
  categoryIds?: string[];
  transparencyAccepted?: boolean;
}) {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("No autorizado");

  // Guard: prevent existing motociclistas from converting their account
  if (profile.role === "ADMIN") {
    throw new Error("Una cuenta de admin no puede registrar un taller");
  }

  const [motoCount, requestCount] = await Promise.all([
    prisma.motorcycle.count({ where: { userId: profile.id } }),
    prisma.serviceRequest.count({ where: { userId: profile.id } }),
  ]);

  if (motoCount > 0 || requestCount > 0) {
    throw new Error("Esta cuenta ya tiene actividad como motociclista. Crea una cuenta nueva para tu taller.");
  }

  // Check if user already has a workshop
  const existingWorkshop = await prisma.workshop.findFirst({
    where: { userId: profile.id },
  });
  if (existingWorkshop) {
    throw new Error("Ya tienes un taller registrado");
  }

  const { categoryIds, transparencyAccepted, contactName, contactEmail, ...workshopData } = data;

  const workshop = await prisma.workshop.create({
    data: {
      name: workshopData.name,
      district: workshopData.district,
      address: workshopData.address,
      phone: workshopData.phone,
      ruc: workshopData.ruc || undefined,
      description: workshopData.description || undefined,
      guaranteePolicy: workshopData.guaranteePolicy || undefined,
      transparencyAccepted: transparencyAccepted || false,
      userId: profile.id,
      status: "PENDIENTE",
    },
  });

  // Create category associations if provided
  if (categoryIds && categoryIds.length > 0) {
    await prisma.workshopCategory.createMany({
      data: categoryIds.map((catId) => ({
        workshopId: workshop.id,
        categoryId: catId,
      })),
    });
  }

  // Update user role to TALLER and save contact info
  await prisma.userProfile.update({
    where: { id: profile.id },
    data: {
      role: "TALLER",
      ...(contactName ? { name: contactName } : {}),
    },
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
