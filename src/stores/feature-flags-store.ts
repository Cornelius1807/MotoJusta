"use client";

import { create } from "zustand";
import { FEATURE_FLAGS, type FeatureFlagKey } from "@/lib/feature-flags";
import {
  getFeatureFlags,
  setFeatureFlag,
  setMvpMode as setMvpModeAction,
  getMvpMode,
} from "@/app/actions/feature-flags";

interface FeatureFlagStore {
  flags: Record<string, { enabled: boolean; isMvp: boolean }>;
  mvpMode: boolean;
  loaded: boolean;
  loadFlags: () => Promise<void>;
  setFlag: (key: FeatureFlagKey, enabled: boolean) => Promise<void>;
  setMvpMode: (enabled: boolean) => Promise<void>;
  isEnabled: (key: FeatureFlagKey) => boolean;
}

export const useFeatureFlags = create<FeatureFlagStore>()((set, get) => ({
  flags: {},
  mvpMode: true,
  loaded: false,

  loadFlags: async () => {
    try {
      const [flagsFromDb, mvpMode] = await Promise.all([
        getFeatureFlags(),
        getMvpMode(),
      ]);
      set({ flags: flagsFromDb, mvpMode, loaded: true });
    } catch (error) {
      console.error("Failed to load feature flags from DB:", error);
      // Fallback: mark as loaded with defaults
      const defaultFlags: Record<string, { enabled: boolean; isMvp: boolean }> = {};
      FEATURE_FLAGS.forEach((f) => {
        defaultFlags[f.key] = { enabled: f.enabledByDefault, isMvp: f.isMvp };
      });
      set({ flags: defaultFlags, mvpMode: true, loaded: true });
    }
  },

  setFlag: async (key, enabled) => {
    // Optimistic update
    set((state) => ({
      flags: {
        ...state.flags,
        [key]: { ...state.flags[key], enabled },
      },
    }));
    // Persist to DB
    await setFeatureFlag(key, enabled);
  },

  setMvpMode: async (enabled) => {
    set({ mvpMode: enabled });
    await setMvpModeAction(enabled);
  },

  isEnabled: (key) => {
    const state = get();
    const flag = state.flags[key];
    if (!flag) return false;
    if (state.mvpMode && !flag.isMvp) return false;
    return flag.enabled;
  },
}));
