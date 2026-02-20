"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_FLAGS, type FeatureFlagKey } from "@/lib/feature-flags";

interface FeatureFlagStore {
  flags: Record<FeatureFlagKey, boolean>;
  mvpMode: boolean;
  setFlag: (key: FeatureFlagKey, enabled: boolean) => void;
  setMvpMode: (enabled: boolean) => void;
  isEnabled: (key: FeatureFlagKey) => boolean;
  resetToDefaults: () => void;
}

export const useFeatureFlags = create<FeatureFlagStore>()(
  persist(
    (set, get) => ({
      flags: { ...DEFAULT_FLAGS },
      mvpMode: true,

      setFlag: (key, enabled) =>
        set((state) => ({
          flags: { ...state.flags, [key]: enabled },
        })),

      setMvpMode: (enabled) => set({ mvpMode: enabled }),

      isEnabled: (key) => {
        const state = get();
        // In MVP mode, only MVP flags are active
        if (state.mvpMode) {
          const flag = DEFAULT_FLAGS[key];
          // Check if it's an MVP feature
          const isMvp = [
            "hu01_registro_motociclista", "hu02_inicio_sesion", "hu03_perfil_motociclista",
            "hu04_registrar_moto", "hu05_crear_solicitud", "hu06_categorias_falla",
            "hu07_preguntas_guia", "hu08_geofiltro_talleres", "hu09_estado_solicitud",
            "hu10_registro_taller", "hu11_verificacion_taller", "hu12_panel_solicitudes_taller",
            "hu13_cotizacion_estructurada", "hu14_alternativas_repuestos", "hu15_comparador_cotizaciones",
            "hu16_chat_interno", "hu17_aceptar_cotizacion", "hu18_rechazar_cotizacion",
            "hu19_orden_digital", "hu22_cambios_adicionales",
          ].includes(key);
          return isMvp ? (flag !== undefined ? state.flags[key] : false) : false;
        }
        return state.flags[key] ?? false;
      },

      resetToDefaults: () => set({ flags: { ...DEFAULT_FLAGS }, mvpMode: true }),
    }),
    { name: "motojusta-feature-flags" }
  )
);
