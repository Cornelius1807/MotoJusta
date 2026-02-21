"use server";

import { prisma } from "@/lib/prisma";
import { FEATURE_FLAGS, type FeatureFlagKey } from "@/lib/feature-flags";

/**
 * Get all feature flags from DB. Auto-seeds if empty.
 */
export async function getFeatureFlags(): Promise<
  Record<string, { enabled: boolean; isMvp: boolean }>
> {
  let flags = await prisma.featureFlag.findMany();

  // Auto-seed from FEATURE_FLAGS definitions if DB is empty
  if (flags.length === 0) {
    await prisma.featureFlag.createMany({
      data: FEATURE_FLAGS.map((f) => ({
        key: f.key,
        name: f.name,
        description: f.description,
        enabled: f.enabledByDefault,
        isMvp: f.isMvp,
      })),
      skipDuplicates: true,
    });
    flags = await prisma.featureFlag.findMany();
  }

  return Object.fromEntries(
    flags.map((f) => [f.key, { enabled: f.enabled, isMvp: f.isMvp }])
  );
}

/**
 * Toggle a single feature flag (admin only).
 */
export async function setFeatureFlag(key: string, enabled: boolean) {
  await prisma.featureFlag.upsert({
    where: { key },
    update: { enabled },
    create: {
      key,
      name: key,
      description: "",
      enabled,
      isMvp: false,
    },
  });
}

/**
 * Toggle MVP mode: when enabled, disable all non-MVP flags;
 * when disabled, restore all flags to their DB enabled state.
 * We store the mvpMode preference as a special flag key.
 */
export async function setMvpMode(enabled: boolean) {
  await prisma.featureFlag.upsert({
    where: { key: "__mvp_mode__" },
    update: { enabled },
    create: {
      key: "__mvp_mode__",
      name: "MVP Mode",
      description: "Global MVP mode toggle",
      enabled,
      isMvp: true,
    },
  });
}

/**
 * Get current MVP mode state.
 */
export async function getMvpMode(): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({
    where: { key: "__mvp_mode__" },
  });
  return flag?.enabled ?? true; // default to MVP mode
}

/**
 * Check if a specific feature is enabled (server-side).
 * Respects MVP mode.
 */
export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const [mvpMode, flag] = await Promise.all([
    getMvpMode(),
    prisma.featureFlag.findUnique({ where: { key } }),
  ]);

  if (!flag) return false;
  if (mvpMode && !flag.isMvp) return false;
  return flag.enabled;
}
