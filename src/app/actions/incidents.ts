"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { incidentReportSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function createIncident(data: {
  workshopId: string;
  type: string;
  description: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  const parsed = incidentReportSchema.parse(data);

  const incident = await prisma.incidentReport.create({
    data: {
      reporterId: profile.id,
      workshopId: parsed.workshopId,
      type: parsed.type as any,
      description: parsed.description,
    },
  });

  logger.audit(profile.id, "REPORT_INCIDENT", incident.id, { type: parsed.type });
  revalidatePath("/app/admin/incidentes");
  return incident;
}

export async function getIncidents() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile || profile.role !== "ADMIN") throw new Error("No autorizado - solo admin");
  return prisma.incidentReport.findMany({
    include: {
      reporter: { select: { name: true, email: true } },
      workshop: { select: { name: true, district: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveIncident(incidentId: string, resolution: string, action?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile || profile.role !== "ADMIN") throw new Error("No autorizado - solo admin");

  const incident = await prisma.incidentReport.update({
    where: { id: incidentId },
    data: {
      status: "RESUELTO",
      resolution,
      resolvedBy: profile.id,
      resolvedAt: new Date(),
    },
  });

  // Log audit action
  await prisma.auditLog.create({
    data: {
      actorId: profile.id,
      action: "RESOLVER_INCIDENTE",
      targetType: "INCIDENT",
      targetId: incidentId,
      reason: resolution,
      metadata: JSON.stringify({ action }),
    },
  });

  logger.audit(profile.id, "RESOLVE_INCIDENT", incidentId, { action });
  revalidatePath("/app/admin/incidentes");
  return incident;
}
