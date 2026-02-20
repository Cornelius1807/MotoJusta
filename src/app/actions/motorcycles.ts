"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateProfile } from "@/lib/get-profile";
import { motorcycleSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

// Return-based pattern so errors reach the client in production
// (Next.js strips thrown error messages in production builds)

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getMotorcycles(): Promise<ActionResult<any[]>> {
  try {
    const profile = await getOrCreateProfile();
    if (!profile) {
      logger.warn("[getMotorcycles] No profile found (user not authenticated)");
      return { success: true, data: [] };
    }

    const motos = await prisma.motorcycle.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: motos };
  } catch (err: any) {
    logger.error("[getMotorcycles] Error", { message: err.message, stack: err.stack?.slice(0, 500) });
    return { success: false, error: `Error al cargar motos: ${err.message}` };
  }
}

export async function createMotorcycle(data: {
  brand: string;
  model: string;
  year: number;
  displacement?: number;
  use?: string;
  kmApprox?: number;
  placa?: string;
  alias?: string;
}): Promise<ActionResult<any>> {
  try {
    const profile = await getOrCreateProfile();
    if (!profile) return { success: false, error: "No autorizado — inicia sesión primero" };

    const parsed = motorcycleSchema.parse(data);

    const createData: any = {
      brand: parsed.brand,
      model: parsed.model,
      year: parsed.year,
      displacement: parsed.displacement ?? null,
      use: parsed.use || null,
      kmApprox: parsed.kmApprox ?? null,
      placa: parsed.placa || null,
      alias: parsed.alias || null,
      userId: profile.id,
    };

    const moto = await prisma.motorcycle.create({ data: createData });

    logger.info("Motorcycle created", { userId: profile.id, motoId: moto.id });
    revalidatePath("/app/motos");
    return { success: true, data: moto };
  } catch (err: any) {
    logger.error("[createMotorcycle] Error", { message: err.message, code: err.code, stack: err.stack?.slice(0, 500) });
    const msg = err.code === "P2002"
      ? "Ya existe una moto con esos datos (marca, modelo, año y alias duplicados)"
      : `Error al crear moto: ${err.message}`;
    return { success: false, error: msg };
  }
}

export async function updateMotorcycle(id: string, data: {
  brand?: string;
  model?: string;
  year?: number;
  displacement?: number;
  use?: string;
  kmApprox?: number;
  placa?: string;
  alias?: string;
}): Promise<ActionResult<any>> {
  try {
    const profile = await getOrCreateProfile();
    if (!profile) return { success: false, error: "No autorizado" };

    const existing = await prisma.motorcycle.findFirst({ where: { id, userId: profile.id } });
    if (!existing) return { success: false, error: "Moto no encontrada" };

    const updateData: any = { ...data, use: data.use || null, placa: data.placa !== undefined ? (data.placa || null) : undefined };
    const moto = await prisma.motorcycle.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/app/motos");
    return { success: true, data: moto };
  } catch (err: any) {
    logger.error("[updateMotorcycle] Error", { message: err.message, stack: err.stack?.slice(0, 500) });
    return { success: false, error: `Error al actualizar moto: ${err.message}` };
  }
}

export async function deleteMotorcycle(id: string): Promise<ActionResult<void>> {
  try {
    const profile = await getOrCreateProfile();
    if (!profile) return { success: false, error: "No autorizado" };

    const existing = await prisma.motorcycle.findFirst({ where: { id, userId: profile.id } });
    if (!existing) return { success: false, error: "Moto no encontrada" };

    await prisma.motorcycle.delete({ where: { id } });

    logger.info("Motorcycle deleted", { userId: profile.id, motoId: id });
    revalidatePath("/app/motos");
    return { success: true, data: undefined };
  } catch (err: any) {
    logger.error("[deleteMotorcycle] Error", { message: err.message, stack: err.stack?.slice(0, 500) });
    return { success: false, error: `Error al eliminar moto: ${err.message}` };
  }
}
