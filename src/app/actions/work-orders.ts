"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

// --- Get work order by ID ---
export async function getWorkOrder(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  return prisma.workOrder.findUnique({
    where: { id },
    include: {
      request: {
        include: {
          motorcycle: true,
          category: true,
          user: { select: { name: true, district: true } },
        },
      },
      quote: { include: { parts: true, workshop: true } },
      workshop: { select: { id: true, name: true, district: true, phone: true, rating: true, totalServices: true, photoUrl: true } },
      changeRequests: { orderBy: { createdAt: "desc" } },
      evidences: { orderBy: { createdAt: "desc" } },
      review: true,
      receipt: true,
    },
  });
}

// --- Get work orders for workshop ---
export async function getWorkshopOrders(filters?: { status?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    include: { workshop: true },
  });
  if (!profile?.workshop) throw new Error("Taller no encontrado");

  return prisma.workOrder.findMany({
    where: {
      workshopId: profile.workshop.id,
      ...(filters?.status ? { status: filters.status as any } : {}),
    },
    include: {
      request: {
        include: {
          motorcycle: { select: { brand: true, model: true, year: true } },
          category: true,
          user: { select: { name: true, district: true } },
        },
      },
      changeRequests: { select: { status: true } },
      evidences: { select: { id: true } },
      review: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// --- Get work orders for motorcyclist ---
export async function getUserOrders() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  return prisma.workOrder.findMany({
    where: { request: { userId: profile.id } },
    include: {
      request: {
        include: {
          motorcycle: { select: { brand: true, model: true, year: true } },
          category: true,
        },
      },
      workshop: { select: { name: true, district: true, rating: true } },
      review: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// --- Start service (HU-20) ---
export async function startService(workOrderId: string, startNote?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    include: { workshop: true },
  });
  if (!profile?.workshop) throw new Error("Taller no encontrado");

  const workOrder = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!workOrder) throw new Error("Orden no encontrada");
  if (workOrder.workshopId !== profile.workshop.id) throw new Error("No autorizado");
  if (workOrder.status !== "PENDIENTE") throw new Error("La orden debe estar PENDIENTE para iniciar servicio");

  const updated = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      status: "EN_SERVICIO",
      startedAt: new Date(),
      startNote: startNote || null,
    },
  });

  // Update request status
  await prisma.serviceRequest.update({
    where: { id: workOrder.requestId },
    data: { status: "EN_SERVICIO" },
  });

  await prisma.requestStatusHistory.create({
    data: {
      requestId: workOrder.requestId,
      fromStatus: "SELECCIONADA",
      toStatus: "EN_SERVICIO",
      actorId: profile.id,
    },
  });

  // Notify user
  await prisma.notification.create({
    data: {
      userId: (await prisma.serviceRequest.findUnique({ where: { id: workOrder.requestId } }))!.userId,
      requestId: workOrder.requestId,
      title: "Servicio iniciado",
      body: `El taller ${profile.workshop.name} ha iniciado el servicio de tu moto`,
      link: `/app/ordenes/${workOrderId}`,
    },
  });

  logger.info("Service started", { workOrderId, workshopId: profile.workshop.id });
  revalidatePath(`/app/ordenes/${workOrderId}`);
  revalidatePath(`/app/taller/ordenes/${workOrderId}`);
  return updated;
}

// --- Complete service (HU-23) ---
export async function completeService(workOrderId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    include: { workshop: true },
  });
  if (!profile?.workshop) throw new Error("Taller no encontrado");

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: { changeRequests: true },
  });
  if (!workOrder) throw new Error("Orden no encontrada");
  if (workOrder.workshopId !== profile.workshop.id) throw new Error("No autorizado");
  if (workOrder.status !== "EN_SERVICIO") throw new Error("La orden debe estar EN_SERVICIO para completar");

  // HU-22: Block if pending change requests
  const pendingChanges = workOrder.changeRequests.filter((c) => c.status === "PENDIENTE");
  if (pendingChanges.length > 0) {
    throw new Error("No se puede cerrar: hay solicitudes de cambio pendientes de aprobación");
  }

  // Calculate total final
  const approvedChanges = workOrder.changeRequests.filter((c) => c.status === "APROBADO");
  const totalChanges = approvedChanges.reduce((sum, c) => sum + c.additionalCost, 0);
  const totalFinal = workOrder.totalAgreed + totalChanges;

  const updated = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      status: "COMPLETADA",
      completedAt: new Date(),
      totalFinal,
    },
  });

  // Create receipt
  await prisma.receipt.create({
    data: {
      workOrderId,
      totalOriginal: workOrder.totalAgreed,
      totalChanges,
      totalFinal,
    },
  });

  logger.info("Service completed", { workOrderId, totalFinal });
  revalidatePath(`/app/ordenes/${workOrderId}`);
  revalidatePath(`/app/taller/ordenes/${workOrderId}`);
  return updated;
}

// --- Close order (HU-23) ---
export async function closeOrder(workOrderId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: { request: true },
  });
  if (!workOrder) throw new Error("Orden no encontrada");
  if (workOrder.request.userId !== profile.id) throw new Error("No autorizado");
  if (workOrder.status !== "COMPLETADA") throw new Error("La orden debe estar COMPLETADA para cerrar");

  const updated = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      status: "CERRADA",
      closedAt: new Date(),
    },
  });

  await prisma.serviceRequest.update({
    where: { id: workOrder.requestId },
    data: { status: "CERRADA" },
  });

  // Increment workshop services count
  await prisma.workshop.update({
    where: { id: workOrder.workshopId },
    data: { totalServices: { increment: 1 } },
  });

  await prisma.requestStatusHistory.create({
    data: {
      requestId: workOrder.requestId,
      fromStatus: "EN_SERVICIO",
      toStatus: "CERRADA",
      actorId: profile.id,
    },
  });

  logger.info("Order closed", { workOrderId });
  revalidatePath(`/app/ordenes/${workOrderId}`);
  revalidatePath("/app/historial");
  return updated;
}
