"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export interface Reminder {
  id: string;
  motoLabel: string;
  motorcycleId: string;
  type: string;
  message: string;
  dueInfo: string;
  dismissed: boolean;
}

// --- HU-27: Get maintenance reminders ---
export async function getReminders(): Promise<Reminder[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return [];

  const motorcycles = await prisma.motorcycle.findMany({
    where: { userId: profile.id },
  });

  if (motorcycles.length === 0) return [];

  // Get last completed orders for each motorcycle
  const reminders: Reminder[] = [];

  for (const moto of motorcycles) {
    const lastOrder = await prisma.workOrder.findFirst({
      where: {
        request: { motorcycleId: moto.id },
        status: { in: ["COMPLETADA", "CERRADA"] },
      },
      include: {
        request: { include: { category: true } },
      },
      orderBy: { completedAt: "desc" },
    });

    const motoLabel = `${moto.brand} ${moto.model} (${moto.year})`;
    const km = moto.kmApprox ?? 0;

    // Oil change reminder based on km
    if (km >= 3000) {
      const lastOilService = lastOrder?.request.category?.slug === "mantenimiento" || lastOrder?.request.category?.slug === "aceite";
      const daysSinceService = lastOrder?.completedAt
        ? Math.floor((Date.now() - new Date(lastOrder.completedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (!lastOilService || daysSinceService > 90) {
        reminders.push({
          id: `oil-${moto.id}`,
          motoLabel,
          motorcycleId: moto.id,
          type: "Cambio de aceite",
          message: km >= 5000
            ? `Tu ${moto.brand} ${moto.model} tiene ${km.toLocaleString()} km. Se recomienda cambio de aceite cada 3,000-5,000 km.`
            : `Próximo cambio de aceite sugerido pronto para tu ${moto.brand} ${moto.model}.`,
          dueInfo: daysSinceService > 90 ? "Hace más de 3 meses del último servicio" : `${km.toLocaleString()} km acumulados`,
          dismissed: false,
        });
      }
    }

    // General maintenance reminder if no service in 6 months
    if (lastOrder?.completedAt) {
      const daysSince = Math.floor((Date.now() - new Date(lastOrder.completedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 180) {
        reminders.push({
          id: `maint-${moto.id}`,
          motoLabel,
          motorcycleId: moto.id,
          type: "Revisión general",
          message: `Han pasado ${Math.floor(daysSince / 30)} meses desde el último servicio de tu ${moto.brand} ${moto.model}. Se recomienda una revisión general.`,
          dueInfo: `Último servicio: ${new Date(lastOrder.completedAt).toLocaleDateString("es-PE")}`,
          dismissed: false,
        });
      }
    } else if (!lastOrder) {
      // No service history at all
      reminders.push({
        id: `first-${moto.id}`,
        motoLabel,
        motorcycleId: moto.id,
        type: "Primera revisión",
        message: `Tu ${moto.brand} ${moto.model} no tiene historial de servicios. Recomendamos una revisión preventiva.`,
        dueInfo: "Sin historial de servicios",
        dismissed: false,
      });
    }
  }

  return reminders;
}

// --- Create custom reminder (placeholder) ---
export async function createReminder(data: {
  motorcycleId: string;
  type: string;
  message: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  // For now, reminders are computed dynamically.
  // This is a placeholder for future custom reminder creation.
  logger.info("Custom reminder requested", { userId, data });
  return { success: true, message: "Recordatorio registrado (próximamente)" };
}

// --- Dismiss reminder (placeholder) ---
export async function dismissReminder(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  // Placeholder: In production, store dismissed state in DB.
  logger.info("Reminder dismissed", { userId, reminderId: id });
  revalidatePath("/app");
  return { success: true };
}
