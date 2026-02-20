"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { quoteSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function createQuote(data: Record<string, unknown>) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    include: { workshop: true },
  });
  if (!profile?.workshop) throw new Error("Perfil de taller no encontrado");

  const parsed = quoteSchema.parse(data);

  const totalParts = parsed.parts.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const quote = await prisma.quote.create({
    data: {
      requestId: parsed.requestId,
      workshopId: profile.workshop.id,
      diagnosis: parsed.diagnosis,
      laborCost: parsed.laborCost,
      totalParts,
      totalCost: totalParts + parsed.laborCost,
      estimatedTime: parsed.estimatedTime,
      validUntil: new Date(parsed.validUntil),
      notes: parsed.notes,
      status: "ENVIADA",
      parts: {
        create: parsed.parts.map((item) => ({
          name: item.name,
          partType: item.partType as any,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
      },
    },
    include: { parts: true },
  });

  // Update request status if first quote
  const quotesCount = await prisma.quote.count({ where: { requestId: parsed.requestId } });
  if (quotesCount === 1) {
    await prisma.serviceRequest.update({
      where: { id: parsed.requestId },
      data: { status: "EN_COTIZACION" },
    });
  }

  logger.info("Quote created", { workshopId: profile.workshop.id, quoteId: quote.id });
  revalidatePath(`/app/solicitudes/${parsed.requestId}`);
  revalidatePath("/app/taller/solicitudes");
  return quote;
}

export async function acceptQuote(quoteId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { request: true },
  });
  if (!quote) throw new Error("Cotización no encontrada");
  if (quote.request.userId !== profile.id) throw new Error("No autorizado");

  // Generate order number
  const orderCount = await prisma.workOrder.count();
  const orderNumber = `MJ-${String(orderCount + 1).padStart(5, "0")}`;

  // Accept quote and create work order in transaction
  const [updatedQuote, workOrder] = await prisma.$transaction([
    prisma.quote.update({
      where: { id: quoteId },
      data: { status: "ACEPTADA" },
    }),
    prisma.workOrder.create({
      data: {
        orderNumber,
        requestId: quote.requestId,
        quoteId: quote.id,
        workshopId: quote.workshopId,
        diagnosis: quote.diagnosis,
        totalAgreed: quote.totalCost,
        status: "PENDIENTE",
        userAcceptedAt: new Date(),
      },
    }),
    prisma.serviceRequest.update({
      where: { id: quote.requestId },
      data: { status: "SELECCIONADA" },
    }),
    // Reject other quotes
    prisma.quote.updateMany({
      where: { requestId: quote.requestId, id: { not: quoteId } },
      data: { status: "RECHAZADA" },
    }),
  ]);

  logger.info("Quote accepted, work order created", { quoteId, workOrderId: workOrder.id });
  revalidatePath(`/app/solicitudes/${quote.requestId}`);
  return workOrder;
}

// --- HU-15: Reject quote ---
export async function rejectQuote(quoteId: string, reason: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { request: true },
  });
  if (!quote) throw new Error("Cotización no encontrada");
  if (quote.request.userId !== profile.id) throw new Error("No autorizado");

  const updated = await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: "RECHAZADA",
      rejectionReason: reason,
    },
  });

  logger.info("Quote rejected", { quoteId, reason });
  revalidatePath(`/app/solicitudes/${quote.requestId}`);
  return updated;
}

// --- HU-15: Counter offer ---
export async function counterOffer(quoteId: string, message: string, suggestedAmount: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { request: true },
  });
  if (!quote) throw new Error("Cotización no encontrada");
  if (quote.request.userId !== profile.id) throw new Error("No autorizado");

  // Create a chat message with the counter offer details
  const counterMsg = `💬 Contraoferta: Propongo S/ ${suggestedAmount.toFixed(2)} (original: S/ ${quote.totalCost.toFixed(2)}). ${message}`;

  await prisma.chatMessage.create({
    data: {
      requestId: quote.requestId,
      senderId: profile.id,
      content: counterMsg,
    },
  });

  // Update the quote rejection reason to track the counter offer
  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      rejectionReason: `Contraoferta: S/ ${suggestedAmount} — ${message}`,
    },
  });

  logger.info("Counter offer sent", { quoteId, suggestedAmount });
  revalidatePath(`/app/solicitudes/${quote.requestId}`);
  return { success: true };
}
