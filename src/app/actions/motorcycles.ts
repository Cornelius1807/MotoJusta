"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { motorcycleSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function getMotorcycles() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

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
  alias?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  const parsed = motorcycleSchema.parse(data);

  const moto = await prisma.motorcycle.create({
    data: {
      ...parsed,
      use: parsed.use as any,
      userId: profile.id,
    },
  });

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
  alias?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  const existing = await prisma.motorcycle.findFirst({ where: { id, userId: profile.id } });
  if (!existing) throw new Error("Moto no encontrada");

  const moto = await prisma.motorcycle.update({
    where: { id },
    data: { ...data, use: data.use as any },
  });

  revalidatePath("/app/motos");
  return moto;
}

export async function deleteMotorcycle(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  const existing = await prisma.motorcycle.findFirst({ where: { id, userId: profile.id } });
  if (!existing) throw new Error("Moto no encontrada");

  await prisma.motorcycle.delete({ where: { id } });

  logger.info("Motorcycle deleted", { userId: profile.id, motoId: id });
  revalidatePath("/app/motos");
}
