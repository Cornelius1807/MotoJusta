"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

// --- Upload evidence (HU-21) ---
export async function addEvidence(data: {
  workOrderId: string;
  stage: string;
  url: string;
  mediaType: string;
  fileName?: string;
  description?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    include: { workshop: true },
  });
  if (!profile?.workshop) throw new Error("Taller no encontrado");

  const workOrder = await prisma.workOrder.findUnique({ where: { id: data.workOrderId } });
  if (!workOrder) throw new Error("Orden no encontrada");
  if (workOrder.workshopId !== profile.workshop.id) throw new Error("No autorizado");
  if (workOrder.status !== "EN_SERVICIO" && workOrder.status !== "COMPLETADA") {
    throw new Error("La orden debe estar EN_SERVICIO o COMPLETADA");
  }

  // Check quota: max 5 images + 1 video per stage per order
  const existing = await prisma.evidence.findMany({
    where: { workOrderId: data.workOrderId, stage: data.stage as any },
  });
  const imageCount = existing.filter((e) => e.mediaType === "IMAGE").length;
  const videoCount = existing.filter((e) => e.mediaType === "VIDEO").length;

  if (data.mediaType === "IMAGE" && imageCount >= 5) {
    throw new Error("Máximo 5 fotos por etapa");
  }
  if (data.mediaType === "VIDEO" && videoCount >= 1) {
    throw new Error("Máximo 1 video por etapa");
  }

  const evidence = await prisma.evidence.create({
    data: {
      workOrderId: data.workOrderId,
      stage: data.stage as any,
      url: data.url,
      mediaType: data.mediaType as any,
      fileName: data.fileName,
      description: data.description,
    },
  });

  // Update workshop evidence rate
  const totalOrders = await prisma.workOrder.count({ where: { workshopId: profile.workshop.id } });
  const ordersWithEvidence = await prisma.workOrder.count({
    where: {
      workshopId: profile.workshop.id,
      evidences: { some: {} },
    },
  });
  await prisma.workshop.update({
    where: { id: profile.workshop.id },
    data: { evidenceRate: totalOrders > 0 ? ordersWithEvidence / totalOrders : 0 },
  });

  logger.info("Evidence added", { workOrderId: data.workOrderId, stage: data.stage, evidenceId: evidence.id });
  revalidatePath(`/app/ordenes/${data.workOrderId}`);
  revalidatePath(`/app/taller/ordenes/${data.workOrderId}`);
  return evidence;
}

// --- Get evidence for work order ---
export async function getEvidence(workOrderId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  return prisma.evidence.findMany({
    where: { workOrderId },
    orderBy: { createdAt: "desc" },
  });
}
