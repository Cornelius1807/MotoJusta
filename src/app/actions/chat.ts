"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Send chat message (HU-16) ---
export async function sendChatMessage(data: {
  requestId: string;
  content: string;
  imageUrl?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  if (!data.content.trim() && !data.imageUrl) {
    throw new Error("El mensaje no puede estar vacío");
  }
  if (data.content.length > 2000) {
    throw new Error("El mensaje es demasiado largo (máx. 2000 caracteres)");
  }

  const message = await prisma.chatMessage.create({
    data: {
      requestId: data.requestId,
      senderId: profile.id,
      content: data.content.trim(),
      imageUrl: data.imageUrl,
    },
    include: {
      sender: { select: { name: true, role: true, avatarUrl: true } },
    },
  });

  revalidatePath(`/app/solicitudes/${data.requestId}`);
  return message;
}

// --- Get chat messages ---
export async function getChatMessages(requestId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  return prisma.chatMessage.findMany({
    where: { requestId },
    include: {
      sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

// --- Mark messages as read ---
export async function markMessagesRead(requestId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) throw new Error("Perfil no encontrado");

  await prisma.chatMessage.updateMany({
    where: {
      requestId,
      senderId: { not: profile.id },
      isRead: false,
    },
    data: { isRead: true },
  });

  revalidatePath(`/app/solicitudes/${requestId}`);
}
