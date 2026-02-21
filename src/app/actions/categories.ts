"use server";

import { prisma } from "@/lib/prisma";

const DEFAULT_CATEGORIES = [
  { name: "Motor", slug: "motor", description: "Problemas de motor, ruidos, humo, pérdida de potencia" },
  { name: "Frenos", slug: "frenos", description: "Pastillas, discos, líquido, ABS" },
  { name: "Suspensión", slug: "suspension", description: "Amortiguadores, horquilla, resortes" },
  { name: "Sistema eléctrico", slug: "electrico", description: "Batería, luces, arranque, alternador" },
  { name: "Transmisión", slug: "transmision", description: "Cadena, piñones, embrague" },
  { name: "Neumáticos", slug: "neumaticos", description: "Cambio, parchado, balanceo" },
  { name: "Mantenimiento general", slug: "mantenimiento", description: "Aceite, filtros, revisión periódica" },
  { name: "Carrocería", slug: "carroceria", description: "Carenado, pintura, espejos, asiento" },
];

export async function getCategories() {
  let cats = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
  });

  // Auto-seed categories if none exist (first deployment)
  if (cats.length === 0) {
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES,
      skipDuplicates: true,
    });
    cats = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, description: true },
    });
  }

  return cats;
}
