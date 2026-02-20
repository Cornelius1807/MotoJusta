import { z } from "zod/v4";

// ============================================
// Validation Schemas (zod) for all entities
// Used in both client and server
// ============================================

// --- Districts catalog (Lima, Peru) ---
export const DISTRICTS = [
  "Ate", "Barranco", "Breña", "Carabayllo", "Chaclacayo", "Chorrillos",
  "Cieneguilla", "Comas", "El Agustino", "Independencia", "Jesús María",
  "La Molina", "La Victoria", "Lima", "Lince", "Los Olivos",
  "Lurigancho", "Lurín", "Magdalena del Mar", "Miraflores", "Pachacámac",
  "Pucusana", "Pueblo Libre", "Puente Piedra", "Punta Hermosa", "Punta Negra",
  "Rímac", "San Bartolo", "San Borja", "San Isidro", "San Juan de Lurigancho",
  "San Juan de Miraflores", "San Luis", "San Martín de Porres", "San Miguel",
  "Santa Anita", "Santa María del Mar", "Santa Rosa", "Santiago de Surco",
  "Surquillo", "Villa El Salvador", "Villa María del Triunfo",
  "Callao", "Bellavista", "Carmen de la Legua Reynoso", "La Perla", "La Punta", "Ventanilla",
] as const;

// --- Motorcycle brands ---
export const MOTORCYCLE_BRANDS = [
  "Honda", "Yamaha", "Suzuki", "Kawasaki", "Bajaj", "TVS",
  "Pulsar", "KTM", "Royal Enfield", "Italika", "Wanxin",
  "Zongshen", "Lifan", "Shineray", "Otro",
] as const;

// --- User Profile ---
export const userProfileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  district: z.string().min(1, "El distrito es obligatorio"),
  notifChannel: z.enum(["PUSH", "EMAIL", "WHATSAPP", "IN_APP"]).default("IN_APP"),
  phoneVisible: z.boolean().default(false),
});

// --- Motorcycle (HU-04) ---
export const motorcycleSchema = z.object({
  brand: z.string().min(1, "La marca es obligatoria"),
  model: z.string().min(1, "El modelo es obligatorio"),
  year: z.number().int().min(1970, "Año mínimo: 1970").max(new Date().getFullYear() + 1, "Año no válido"),
  displacement: z.number().int().min(50).max(2000).optional(),
  use: z.enum(["TRABAJO", "DIARIO", "MIXTO"]).optional(),
  kmApprox: z.number().int().min(0).optional(),
  placa: z.string().max(10).optional(),
  alias: z.string().max(50).optional(),
});

// --- Service Request (HU-05) ---
export const serviceRequestSchema = z.object({
  motorcycleId: z.string().min(1, "Selecciona una moto"),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres").max(2000),
  district: z.string().min(1, "El distrito es obligatorio"),
  urgency: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]).default("MEDIA"),
});

// --- Workshop Registration (HU-10) ---
export const workshopRegistrationSchema = z.object({
  name: z.string().min(2, "El nombre del taller es obligatorio").max(200),
  address: z.string().min(5, "La dirección es obligatoria").max(500),
  district: z.string().min(1, "El distrito es obligatorio"),
  phone: z.string().min(7, "Teléfono inválido").max(15),
  ruc: z.string().length(11, "RUC debe tener 11 dígitos").optional().or(z.literal("")),
  description: z.string().max(1000).optional(),
  guaranteePolicy: z.string().max(2000).optional(),
  categoryIds: z.array(z.string()).min(1, "Selecciona al menos una categoría"),
  transparencyAccepted: z.boolean().refine((val) => val === true, "Debes aceptar la política de transparencia"),
});

// --- Quote (HU-13) ---
export const quotePartItemSchema = z.object({
  name: z.string().min(1, "Nombre del repuesto obligatorio"),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0, "El precio no puede ser negativo"),
  partType: z.enum(["ORIGINAL", "ALTERNATIVO"]).default("ORIGINAL"),
  notes: z.string().max(500).optional(),
  alternativeName: z.string().optional(),
  alternativePrice: z.number().min(0).optional(),
  alternativeType: z.enum(["ORIGINAL", "ALTERNATIVO"]).optional(),
  alternativeNotes: z.string().max(500).optional(),
});

export const quoteSchema = z.object({
  requestId: z.string().min(1),
  diagnosis: z.string().min(10, "El diagnóstico debe tener al menos 10 caracteres"),
  laborCost: z.number().min(0, "El costo de mano de obra no puede ser negativo"),
  estimatedTime: z.string().min(1, "El tiempo estimado es obligatorio"),
  validUntil: z.string().min(1, "La fecha de vigencia es obligatoria"),
  notes: z.string().max(2000).optional(),
  parts: z.array(quotePartItemSchema).min(0),
});

// --- Change Request (HU-22) ---
export const changeRequestSchema = z.object({
  description: z.string().min(10, "Describe el cambio adicional (mínimo 10 caracteres)"),
  justification: z.string().min(10, "Justifica el cambio (mínimo 10 caracteres)"),
  additionalCost: z.number().min(0, "El costo no puede ser negativo"),
  additionalTime: z.string().optional(),
});

// --- Review (HU-24) ---
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
}).refine(
  (data) => data.rating > 2 || (data.comment && data.comment.length >= 10),
  { message: "El comentario es obligatorio para calificaciones de 1 o 2 estrellas (mín. 10 caracteres)" }
);

// --- Incident Report (HU-27) ---
export const incidentReportSchema = z.object({
  workshopId: z.string().min(1),
  type: z.enum(["SOBRECOSTO", "FALTA_EVIDENCIA", "TRATO_INDEBIDO", "OTRO"]),
  description: z.string().min(20, "Describe el incidente (mínimo 20 caracteres)").max(2000),
});

// --- Terms Acceptance ---
export const termsAcceptanceSchema = z.object({
  termsAccepted: z.boolean().refine((val) => val === true, "Debes aceptar los términos"),
  privacyAccepted: z.boolean().refine((val) => val === true, "Debes aceptar la política de privacidad"),
});
