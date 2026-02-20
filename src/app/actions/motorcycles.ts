"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateProfile } from "@/lib/get-profile";
import { motorcycleSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function getMotorcycles() {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("No autorizado");

  return prisma.motorcycle.findMany({
    where: { userId: profile.id },
    orderBy: { createdAt: "desc" },
  });
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
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("No autorizado");

  const parsed = motorcycleSchema.parse(data);

  const createData: any = {
    brand: parsed.brand,
    model: parsed.model,
    year: parsed.year,
    displacement: parsed.displacement ?? null,
    use: parsed.use,
    kmApprox: parsed.kmApprox ?? null,
    placa: parsed.placa || null,
    alias: parsed.alias || null,
    userId: profile.id,
  };

  const moto = await prisma.motorcycle.create({ data: createData });

  logger.info("Motorcycle created", { userId: profile.id, motoId: moto.id });
  revalidatePath("/app/motos");
  return moto;
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
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("No autorizado");

  const existing = await prisma.motorcycle.findFirst({ where: { id, userId: profile.id } });
  if (!existing) throw new Error("Moto no encontrada");

  const updateData: any = { ...data, use: data.use, placa: data.placa !== undefined ? (data.placa || null) : undefined };
  const moto = await prisma.motorcycle.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/app/motos");
  return moto;
}

export async function deleteMotorcycle(id: string) {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("No autorizado");

  const existing = await prisma.motorcycle.findFirst({ where: { id, userId: profile.id } });
  if (!existing) throw new Error("Moto no encontrada");

  await prisma.motorcycle.delete({ where: { id } });

  logger.info("Motorcycle deleted", { userId: profile.id, motoId: id });
  revalidatePath("/app/motos");
}
