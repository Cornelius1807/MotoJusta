"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { serviceRequestSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function getServiceRequests(filters?: { status?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  return prisma.serviceRequest.findMany({
    where: {
      userId: profile.id,
      ...(filters?.status ? { status: filters.status as any } : {}),
    },
    include: {
      motorcycle: true,
      category: true,
      _count: { select: { quotes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAvailableRequests(filters?: { categoryId?: string; district?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  return prisma.serviceRequest.findMany({
    where: {
      status: "PUBLICADA",
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
    },
    include: {
      motorcycle: { select: { brand: true, model: true, year: true } },
      category: true,
      user: { select: { district: true } },
      _count: { select: { quotes: true, media: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createServiceRequest(data: {
  motorcycleId: string;
  categoryId: string;
  description: string;
  urgency?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  const parsed = serviceRequestSchema.parse(data);

  const request = await prisma.serviceRequest.create({
    data: {
      ...parsed,
      urgency: parsed.urgency as any,
      userId: profile.id,
      status: "PUBLICADA",
    },
  });

  // Create status history
  await prisma.requestStatusHistory.create({
    data: {
      requestId: request.id,
      fromStatus: "BORRADOR",
      toStatus: "PUBLICADA",
      actorId: profile.id,
    },
  });

  logger.info("Service request created", { userId: profile.id, requestId: request.id });
  revalidatePath("/app/solicitudes");
  revalidatePath("/app/taller/solicitudes");
  return request;
}

export async function getServiceRequestById(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  return prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      motorcycle: true,
      category: true,
      user: { select: { name: true, district: true } },
      quotes: {
        include: {
          workshop: { select: { name: true, district: true, rating: true, totalServices: true } },
          parts: true,
        },
        orderBy: { createdAt: "asc" },
      },
      media: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      guideAnswers: { include: { question: true } },
    },
  });
}

// --- HU-08: Cost estimation range based on historical quotes ---
export async function estimateCost(categorySlug: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  // Find category by slug
  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    return { min: 0, max: 0, avg: 0, count: 0 };
  }

  // Get historical quotes for service requests in this category
  const quotes = await prisma.quote.findMany({
    where: {
      request: { categoryId: category.id },
      status: { in: ["ENVIADA", "ACEPTADA"] },
    },
    select: { totalCost: true },
  });

  if (quotes.length === 0) {
    return { min: 0, max: 0, avg: 0, count: 0 };
  }

  const costs = quotes.map((q) => q.totalCost);
  const min = Math.min(...costs);
  const max = Math.max(...costs);
  const avg = Math.round(costs.reduce((a, b) => a + b, 0) / costs.length);

  return { min, max, avg, count: quotes.length };
}
