"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { changeRequestSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

// --- Create change request (HU-22) ---
export async function createChangeRequest(data: {
  workOrderId: string;
  description: string;
  justification: string;
  additionalCost: number;
  additionalTime?: string;
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
  if (workOrder.status !== "EN_SERVICIO") throw new Error("La orden debe estar EN_SERVICIO");

  const parsed = changeRequestSchema.parse(data);

  const changeRequest = await prisma.changeRequest.create({
    data: {
      workOrderId: data.workOrderId,
      description: parsed.description,
      justification: parsed.justification,
      additionalCost: parsed.additionalCost,
      additionalTime: parsed.additionalTime,
      status: "PENDIENTE",
    },
  });

  // Notify motorcycle owner
  const request = await prisma.serviceRequest.findUnique({ where: { id: workOrder.requestId } });
  if (request) {
    await prisma.notification.create({
      data: {
        userId: request.userId,
        requestId: request.id,
        title: "Cambio adicional solicitado",
        body: `El taller solicita un cambio: ${parsed.description} (+S/${parsed.additionalCost.toFixed(2)})`,
        link: `/app/ordenes/${data.workOrderId}`,
      },
    });
  }

  logger.audit(profile.id, "CREATE_CHANGE_REQUEST", changeRequest.id, { workOrderId: data.workOrderId, cost: parsed.additionalCost });
  revalidatePath(`/app/ordenes/${data.workOrderId}`);
  revalidatePath(`/app/taller/ordenes/${data.workOrderId}`);
  return changeRequest;
}

// --- Approve change request (HU-22) ---
export async function approveChangeRequest(changeRequestId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  const changeRequest = await prisma.changeRequest.findUnique({
    where: { id: changeRequestId },
    include: { workOrder: { include: { request: true } } },
  });
  if (!changeRequest) throw new Error("Solicitud de cambio no encontrada");
  if (changeRequest.workOrder.request.userId !== profile.id) throw new Error("No autorizado");
  if (changeRequest.status !== "PENDIENTE") throw new Error("Esta solicitud ya fue procesada");

  const updated = await prisma.changeRequest.update({
    where: { id: changeRequestId },
    data: {
      status: "APROBADO",
      decidedAt: new Date(),
      decidedBy: profile.id,
    },
  });

  logger.audit(profile.id, "APPROVE_CHANGE", changeRequestId);
  revalidatePath(`/app/ordenes/${changeRequest.workOrderId}`);
  revalidatePath(`/app/taller/ordenes/${changeRequest.workOrderId}`);
  return updated;
}

// --- Reject change request (HU-22) ---
export async function rejectChangeRequest(changeRequestId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  const changeRequest = await prisma.changeRequest.findUnique({
    where: { id: changeRequestId },
    include: { workOrder: { include: { request: true } } },
  });
  if (!changeRequest) throw new Error("Solicitud de cambio no encontrada");
  if (changeRequest.workOrder.request.userId !== profile.id) throw new Error("No autorizado");
  if (changeRequest.status !== "PENDIENTE") throw new Error("Esta solicitud ya fue procesada");

  const updated = await prisma.changeRequest.update({
    where: { id: changeRequestId },
    data: {
      status: "RECHAZADO",
      decidedAt: new Date(),
      decidedBy: profile.id,
    },
  });

  logger.audit(profile.id, "REJECT_CHANGE", changeRequestId);
  revalidatePath(`/app/ordenes/${changeRequest.workOrderId}`);
  revalidatePath(`/app/taller/ordenes/${changeRequest.workOrderId}`);
  return updated;
}

// --- Get change requests for a work order ---
export async function getChangeRequests(workOrderId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  return prisma.changeRequest.findMany({
    where: { workOrderId },
    orderBy: { createdAt: "desc" },
  });
}
