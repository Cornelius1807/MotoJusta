// Feature flags configuration for MVP vs Labs mode
// HU feature mapping

export type FeatureFlagKey =
  | "hu01_registro_motociclista"
  | "hu02_inicio_sesion"
  | "hu03_perfil_motociclista"
  | "hu04_registrar_moto"
  | "hu05_crear_solicitud"
  | "hu06_categorias_falla"
  | "hu07_preguntas_guia"
  | "hu08_geofiltro_talleres"
  | "hu09_estado_solicitud"
  | "hu10_registro_taller"
  | "hu11_verificacion_taller"
  | "hu12_panel_solicitudes_taller"
  | "hu13_cotizacion_estructurada"
  | "hu14_alternativas_repuestos"
  | "hu15_comparador_cotizaciones"
  | "hu16_chat_interno"
  | "hu17_aceptar_cotizacion"
  | "hu18_rechazar_cotizacion"
  | "hu19_orden_digital"
  | "hu20_inicio_servicio"
  | "hu21_evidencia_trabajo"
  | "hu22_cambios_adicionales"
  | "hu23_cierre_servicio"
  | "hu24_calificacion_verificada"
  | "hu25_perfil_publico_taller"
  | "hu26_historial_mantenimiento"
  | "hu27_reporte_incidente"
  | "hu28_moderacion_sanciones"
  | "hu29_ranking_valor"
  | "hu30_recomendaciones"
  | "hu31_notificaciones"
  | "hu32_analitica_basica"
  | "hu33_ia_resumen_diagnostico"
  | "hu34_ia_alertas_red_flags"
  | "hu35_ia_clasificacion_falla"
  | "hu36_ia_resumen_comparativo"
  | "hu37_ia_glosario_diagnostico"
  | "hu38_ia_diagnostico_imagen";

export interface FeatureFlagDef {
  key: FeatureFlagKey;
  name: string;
  description: string;
  isMvp: boolean;
  enabledByDefault: boolean;
  badge: "MVP" | "EXTRA" | "LABS";
}

export const FEATURE_FLAGS: FeatureFlagDef[] = [
  // MVP Features (HU-01..HU-19 + HU-22 + HU-15)
  { key: "hu01_registro_motociclista", name: "Registro Motociclista", description: "HU-01: Registro por correo/teléfono con OTP", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu02_inicio_sesion", name: "Inicio de Sesión", description: "HU-02: Login sin contraseña", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu03_perfil_motociclista", name: "Perfil Motociclista", description: "HU-03: Completar perfil + preferencias", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu04_registrar_moto", name: "Registrar Moto", description: "HU-04: Registrar motocicleta con datos", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu05_crear_solicitud", name: "Crear Solicitud", description: "HU-05: Publicar solicitud de servicio", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu06_categorias_falla", name: "Categorías de Falla", description: "HU-06: Catálogo de categorías/subcategorías", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu07_preguntas_guia", name: "Preguntas Guía", description: "HU-07: Preguntas dinámicas por categoría", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu08_geofiltro_talleres", name: "Geofiltro Talleres", description: "HU-08: Notificar talleres cercanos verificados", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu09_estado_solicitud", name: "Estado de Solicitud", description: "HU-09: Máquina de estados con bitácora", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu10_registro_taller", name: "Registro de Taller", description: "HU-10: Registro de negocio con evidencia", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu11_verificacion_taller", name: "Verificación Taller", description: "HU-11: Workflow admin de verificación", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu12_panel_solicitudes_taller", name: "Panel Solicitudes Taller", description: "HU-12: Ver y filtrar solicitudes disponibles", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu13_cotizacion_estructurada", name: "Cotización Estructurada", description: "HU-13: Desglose obligatorio de cotización", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu14_alternativas_repuestos", name: "Alternativas Repuestos", description: "HU-14: Opciones original/alternativo", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu15_comparador_cotizaciones", name: "Comparador Cotizaciones", description: "HU-15: Tabla comparativa de ofertas", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu16_chat_interno", name: "Chat Interno", description: "HU-16: Chat in-app sin exponer teléfono", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu17_aceptar_cotizacion", name: "Aceptar Cotización", description: "HU-17: Confirmación en 2 pasos", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu18_rechazar_cotizacion", name: "Rechazar Cotización", description: "HU-18: Rechazar con motivo opcional", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu19_orden_digital", name: "Orden Digital", description: "HU-19: Orden inmutable con firma digital", isMvp: true, enabledByDefault: true, badge: "MVP" },
  { key: "hu22_cambios_adicionales", name: "Cambios Adicionales", description: "HU-22: BLOQUEANTE - Aprobación de cambios", isMvp: true, enabledByDefault: true, badge: "MVP" },

  // EXTRA Features
  { key: "hu20_inicio_servicio", name: "Inicio de Servicio", description: "HU-20: Marcar inicio con nota", isMvp: false, enabledByDefault: true, badge: "EXTRA" },
  { key: "hu21_evidencia_trabajo", name: "Evidencia del Trabajo", description: "HU-21: Fotos/videos por hito", isMvp: false, enabledByDefault: true, badge: "EXTRA" },
  { key: "hu23_cierre_servicio", name: "Cierre de Servicio", description: "HU-23: Cierre con validación de cambios", isMvp: false, enabledByDefault: true, badge: "EXTRA" },
  { key: "hu24_calificacion_verificada", name: "Calificación Verificada", description: "HU-24: Reseña post-servicio", isMvp: false, enabledByDefault: true, badge: "EXTRA" },
  { key: "hu25_perfil_publico_taller", name: "Perfil Público Taller", description: "HU-25: Perfil con rating y métricas", isMvp: false, enabledByDefault: true, badge: "EXTRA" },
  { key: "hu26_historial_mantenimiento", name: "Historial Mantenimiento", description: "HU-26: Historial por moto con export PDF", isMvp: false, enabledByDefault: true, badge: "EXTRA" },
  { key: "hu27_reporte_incidente", name: "Reporte de Incidente", description: "HU-27: Reportar irregularidades", isMvp: false, enabledByDefault: true, badge: "EXTRA" },
  { key: "hu28_moderacion_sanciones", name: "Moderación y Sanciones", description: "HU-28: Gestión admin de reportes", isMvp: false, enabledByDefault: true, badge: "EXTRA" },
  { key: "hu29_ranking_valor", name: "Ranking por Valor", description: "HU-29: Score ponderado configurable", isMvp: false, enabledByDefault: false, badge: "EXTRA" },
  { key: "hu30_recomendaciones", name: "Recomendaciones", description: "HU-30: Recomendaciones personalizadas", isMvp: false, enabledByDefault: false, badge: "EXTRA" },
  { key: "hu31_notificaciones", name: "Notificaciones", description: "HU-31: Push + in-app + email", isMvp: false, enabledByDefault: true, badge: "EXTRA" },
  { key: "hu32_analitica_basica", name: "Analítica Básica", description: "HU-32: KPIs y métricas admin", isMvp: false, enabledByDefault: true, badge: "EXTRA" },

  // LABS Features (AI)
  { key: "hu33_ia_resumen_diagnostico", name: "IA: Resumen Diagnóstico", description: "HU-33: Traducir diagnóstico a lenguaje simple", isMvp: false, enabledByDefault: false, badge: "LABS" },
  { key: "hu34_ia_alertas_red_flags", name: "IA: Alertas Red Flags", description: "HU-34: Detectar cotizaciones vagas/inconsistentes", isMvp: false, enabledByDefault: false, badge: "LABS" },
  { key: "hu35_ia_clasificacion_falla", name: "IA: Clasificación Falla", description: "HU-35: Sugerir categoría por descripción/fotos", isMvp: false, enabledByDefault: false, badge: "LABS" },
  { key: "hu36_ia_resumen_comparativo", name: "IA: Resumen Comparativo", description: "HU-36: Comparar y resumir cotizaciones con IA", isMvp: false, enabledByDefault: false, badge: "LABS" },
  { key: "hu37_ia_glosario_diagnostico", name: "IA: Glosario Diagnóstico", description: "HU-37: Normalización + glosario técnico", isMvp: false, enabledByDefault: false, badge: "LABS" },
  { key: "hu38_ia_diagnostico_imagen", name: "IA: Diagnóstico por Imagen", description: "HU-38: Diagnóstico por visión (LABS/EXPERIMENTAL)", isMvp: false, enabledByDefault: false, badge: "LABS" },
];

// Default runtime flags (can be overridden from DB/admin panel)
export const DEFAULT_FLAGS: Record<FeatureFlagKey, boolean> = Object.fromEntries(
  FEATURE_FLAGS.map((f) => [f.key, f.enabledByDefault])
) as Record<FeatureFlagKey, boolean>;
