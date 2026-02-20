"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateProfile } from "@/lib/get-profile";
import { motorcycleSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function getMotorcycles() {
  try {
    const profile = await getOrCreateProfile();
    if (!profile) {
      logger.warn("[getMotorcycles] No profile found (user not authenticated)");
      return [];
    }

    const motos = await prisma.motorcycle.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
    });
    return motos;
  } catch (err: any) {
    logger.error("[getMotorcycles] Error", { message: err.message, stack: err.stack?.slice(0, 500) });
    throw new Error(`Error al cargar motos: ${err.message}`);
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
}) {
  try {
    const profile = await getOrCreateProfile();
    if (!profile) throw new Error("No autorizado — no se encontró perfil de usuario");

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
    return moto;
  } catch (err: any) {
    logger.error("[createMotorcycle] Error", { message: err.message, code: err.code, stack: err.stack?.slice(0, 500) });
    throw new Error(`Error al crear moto: ${err.message}`);
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
}) {
  try {
    const profile = await getOrCreateProfile();
    if (!profile) throw new Error("No autorizado");

    const existing = await prisma.motorcycle.findFirst({ where: { id, userId: profile.id } });
    if (!existing) throw new Error("Moto no encontrada");

    const updateData: any = { ...data, use: data.use || null, placa: data.placa !== undefined ? (data.placa || null) : undefined };
    const moto = await prisma.motorcycle.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/app/motos");
    return moto;
  } catch (err: any) {
    logger.error("[updateMotorcycle] Error", { message: err.message, stack: err.stack?.slice(0, 500) });
    throw new Error(`Error al actualizar moto: ${err.message}`);
  }
}

export async function deleteMotorcycle(id: string) {
  try {
    const profile = await getOrCreateProfile();
    if (!profile) throw new Error("No autorizado");

    const existing = await prisma.motorcycle.findFirst({ where: { id, userId: profile.id } });
    if (!existing) throw new Error("Moto no encontrada");

    await prisma.motorcycle.delete({ where: { id } });

    logger.info("Motorcycle deleted", { userId: profile.id, motoId: id });
    revalidatePath("/app/motos");
  } catch (err: any) {
    logger.error("[deleteMotorcycle] Error", { message: err.message, stack: err.stack?.slice(0, 500) });
    throw new Error(`Error al eliminar moto: ${err.message}`);
  }
}
