"use client";

import { useFeatureFlags } from "@/stores/feature-flags-store";
import { type FeatureFlagKey } from "@/lib/feature-flags";

interface FeatureGateProps {
  flag: FeatureFlagKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on a feature flag.
 * When the flag is disabled (or MVP mode hides it), shows fallback instead.
 */
export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const { isEnabled, loaded } = useFeatureFlags();

  if (!loaded) return null;
  if (!isEnabled(flag)) return <>{fallback}</>;
  return <>{children}</>;
}
