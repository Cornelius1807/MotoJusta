"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function createReview(data: {
  workOrderId: string;
  rating: number;
  comment?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  const parsed = reviewSchema.parse({ rating: data.rating, comment: data.comment });
  const { workOrderId } = data;

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: { request: true, workshop: true },
  });
  if (!workOrder) throw new Error("Orden no encontrada");
  if (workOrder.request.userId !== profile.id) throw new Error("No autorizado");

  // Rating <= 2 requires comment (also enforced by zod refine)
  if (parsed.rating <= 2 && (!parsed.comment || parsed.comment.length < 10)) {
    throw new Error("Calificaciones de 2 o menos requieren un comentario (mín. 10 caracteres)");
  }

  const review = await prisma.review.create({
    data: {
      workOrderId,
      workshopId: workOrder.workshopId,
      userId: profile.id,
      rating: parsed.rating,
      comment: parsed.comment,
      editableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Update workshop average rating
  const avgResult = await prisma.review.aggregate({
    where: { workshopId: workOrder.workshopId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.workshop.update({
    where: { id: workOrder.workshopId },
    data: {
      rating: avgResult._avg.rating || 0,
    },
  });

  logger.info("Review created", { userId: profile.id, reviewId: review.id, rating: parsed.rating });
  revalidatePath(`/app/ordenes/${workOrderId}`);
  return review;
}
