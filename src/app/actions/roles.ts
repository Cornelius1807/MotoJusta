"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateProfile } from "@/lib/get-profile";

/**
 * Get the current user's role from DB.
 */
export async function getCurrentRole() {
  const profile = await getOrCreateProfile();
  if (!profile) return null;
  return profile.role;
}

/**
 * Check if the current user has existing motociclista data
 * (motorcycles, service requests). Used to prevent an existing
 * motociclista from converting their account to taller.
 */
export async function checkUserHasExistingData() {
  const profile = await getOrCreateProfile();
  if (!profile) return { hasData: false, role: null };

  const [motoCount, requestCount] = await Promise.all([
    prisma.motorcycle.count({ where: { userId: profile.id } }),
    prisma.serviceRequest.count({ where: { userId: profile.id } }),
  ]);

  return {
    hasData: motoCount > 0 || requestCount > 0,
    role: profile.role,
  };
}
