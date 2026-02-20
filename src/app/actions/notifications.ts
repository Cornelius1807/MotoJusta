"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateProfile } from "@/lib/get-profile";
import { revalidatePath } from "next/cache";

// --- Get notifications ---
export async function getNotifications() {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("No autorizado");

  return prisma.notification.findMany({
    where: { userId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// --- Mark notification as read ---
export async function markNotificationRead(notificationId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  revalidatePath("/app/notificaciones");
}

// --- Mark all as read ---
export async function markAllNotificationsRead() {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("No autorizado");

  await prisma.notification.updateMany({
    where: { userId: profile.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/app/notificaciones");
}

// --- Delete notification ---
export async function deleteNotification(notificationId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  await prisma.notification.delete({ where: { id: notificationId } });
  revalidatePath("/app/notificaciones");
}

// --- Get unread count ---
export async function getUnreadCount() {
  const profile = await getOrCreateProfile();
  if (!profile) return 0;

  return prisma.notification.count({
    where: { userId: profile.id, isRead: false },
  });
}

// --- Create notification (internal helper) ---
export async function createNotification(data: {
  userId: string;
  requestId?: string;
  title: string;
  body: string;
  link?: string;
}) {
  return prisma.notification.create({ data });
}
