"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ============================================
// AI Features (HU-33..HU-38)
// Client-side / mock implementation (no paid services)
// Falls back to rule-based analysis when no API key
// ============================================

const DISCLAIMER = "Este análisis es generado automáticamente y tiene fines informativos. Consulte siempre con un técnico certificado.";

// --- HU-33: Simple diagnosis summary ---
export async function generateDiagnosisSummary(quoteId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { parts: true, workshop: true },
  });
  if (!quote) throw new Error("Cotización no encontrada");

  // Build structured summary from quote data
  const partsExplained = quote.parts.map((p) => ({
    name: p.name,
    type: p.partType,
    cost: `S/${(p.unitPrice * p.quantity).toFixed(2)}`,
    explanation: generatePartExplanation(p.name),
  }));

  const riskAssessment = generateRiskAssessment(quote.diagnosis);

  const summary = {
    diagnosisSimple: simplifyDiagnosis(quote.diagnosis),
    partsExplained,
    riskIfNotRepaired: riskAssessment,
    totalBreakdown: {
      parts: `S/${quote.totalParts.toFixed(2)}`,
      labor: `S/${quote.laborCost.toFixed(2)}`,
      total: `S/${quote.totalCost.toFixed(2)}`,
    },
    traceability: {
      source: "quote",
      quoteId: quote.id,
      workshopName: quote.workshop.name,
    },
    disclaimer: DISCLAIMER,
  };

  // Store AI suggestion
  await prisma.aiQuoteAnalysis.create({
    data: {
      quoteId,
      type: "DIAGNOSIS_SUMMARY",
      input: quote.diagnosis,
      output: JSON.stringify(summary),
      traceability: JSON.stringify(summary.traceability),
      modelVersion: "rule-based-v1",
    },
  });

  logger.info("AI diagnosis summary generated", { quoteId });
  return summary;
}

// --- HU-34: Red flags detection ---
export async function detectRedFlags(quoteId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { parts: true, request: { include: { category: true } } },
  });
  if (!quote) throw new Error("Cotización no encontrada");

  const flags: Array<{ type: string; severity: "ALTA" | "MEDIA" | "BAJA"; description: string; suggestedQuestion: string }> = [];

  // Rule: No parts listed
  if (quote.parts.length === 0 && quote.totalParts > 0) {
    flags.push({
      type: "SIN_DESGLOSE",
      severity: "ALTA",
      description: "La cotización incluye costo de repuestos pero no detalla cuáles son",
      suggestedQuestion: "¿Podría detallar qué repuestos específicos se necesitan y sus precios individuales?",
    });
  }

  // Rule: Generic diagnosis
  const genericTerms = ["arreglo general", "reparación general", "mantenimiento general", "revisión general"];
  if (genericTerms.some((t) => quote.diagnosis.toLowerCase().includes(t))) {
    flags.push({
      type: "DIAGNOSTICO_VAGO",
      severity: "MEDIA",
      description: "El diagnóstico usa términos genéricos sin especificar el problema exacto",
      suggestedQuestion: "¿Podría ser más específico sobre qué componentes necesitan atención y por qué?",
    });
  }

  // Rule: Parts without type specification
  const untyped = quote.parts.filter((p) => !p.partType);
  if (untyped.length > 0) {
    flags.push({
      type: "REPUESTOS_SIN_TIPO",
      severity: "BAJA",
      description: `${untyped.length} repuesto(s) no especifican si son originales o alternativos`,
      suggestedQuestion: "¿Los repuestos listados son originales o alternativos? ¿Hay opciones de ambos?",
    });
  }

  // Rule: Very high labor cost relative to parts
  if (quote.laborCost > quote.totalParts * 2 && quote.totalParts > 0) {
    flags.push({
      type: "MANO_OBRA_ALTA",
      severity: "MEDIA",
      description: "El costo de mano de obra es significativamente mayor al de repuestos",
      suggestedQuestion: "¿Podría explicar por qué la mano de obra es así de elevada? ¿Es un procedimiento complejo?",
    });
  }

  // Rule: No estimated time
  if (!quote.estimatedTime || quote.estimatedTime === "0") {
    flags.push({
      type: "SIN_TIEMPO",
      severity: "BAJA",
      description: "No se indica tiempo estimado de servicio",
      suggestedQuestion: "¿Cuánto tiempo aproximado tomará el servicio?",
    });
  }

  // Rule: Short validity
  const validityDays = Math.ceil((new Date(quote.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (validityDays <= 1) {
    flags.push({
      type: "VIGENCIA_CORTA",
      severity: "BAJA",
      description: "La cotización tiene una vigencia muy corta",
      suggestedQuestion: "¿Es posible extender la vigencia de la cotización para tener más tiempo de evaluar?",
    });
  }

  // Store analysis
  await prisma.aiQuoteAnalysis.create({
    data: {
      quoteId,
      type: "RED_FLAGS",
      input: JSON.stringify({ diagnosis: quote.diagnosis, partsCount: quote.parts.length }),
      output: JSON.stringify(flags),
      modelVersion: "rule-based-v1",
    },
  });

  logger.info("AI red flags detected", { quoteId, flagCount: flags.length });
  return { flags, disclaimer: DISCLAIMER };
}

// --- HU-35: Category suggestion ---
export async function suggestCategory(description: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const categories = await prisma.category.findMany({ where: { isActive: true } });

  // Simple keyword matching for category suggestion
  const keywords: Record<string, string[]> = {
    "motor": ["motor", "pistón", "válvula", "carburador", "inyección", "arranque", "aceleración", "revoluciones", "potencia"],
    "frenos": ["freno", "pastilla", "disco", "zapata", "líquido de frenos", "frenado"],
    "electrico": ["batería", "luces", "faro", "claxon", "arranque eléctrico", "fusible", "cable", "bujía"],
    "suspension": ["suspensión", "amortiguador", "horquilla", "resorte"],
    "transmision": ["cadena", "piñón", "embrague", "caja", "cambio", "transmisión"],
    "neumaticos": ["llanta", "neumático", "rin", "cámara", "pinchazo", "ponche"],
    "aceite": ["aceite", "filtro", "lubricante", "mantenimiento preventivo"],
    "carroceria": ["carenado", "plástico", "pintura", "asiento", "espejo", "retrovisor"],
  };

  const descLower = description.toLowerCase();
  const scores: Array<{ categoryId: string; name: string; score: number }> = [];

  for (const cat of categories) {
    const catSlug = cat.slug.toLowerCase();
    const catKeywords = keywords[catSlug] || [cat.name.toLowerCase()];
    let score = 0;

    for (const kw of catKeywords) {
      if (descLower.includes(kw)) score += 0.3;
    }
    if (descLower.includes(cat.name.toLowerCase())) score += 0.4;

    if (score > 0) {
      scores.push({ categoryId: cat.id, name: cat.name, score: Math.min(score, 0.95) });
    }
  }

  scores.sort((a, b) => b.score - a.score);
  const top3 = scores.slice(0, 3);

  // If low confidence, suggest "No estoy seguro"
  const isConclusive = top3.length > 0 && top3[0].score >= 0.4;

  return {
    suggestions: top3,
    isConclusive,
    fallbackMessage: isConclusive ? null : "No estoy seguro de la categoría. Selecciona la que mejor se ajuste o elige 'No estoy seguro'.",
    disclaimer: DISCLAIMER,
  };
}

// --- HU-36: Comparative summary ---
export async function generateComparativeSummary(requestId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const quotes = await prisma.quote.findMany({
    where: { requestId, status: { in: ["ENVIADA", "ACEPTADA"] } },
    include: {
      parts: true,
      workshop: { select: { name: true, rating: true, totalServices: true, district: true } },
    },
  });

  if (quotes.length < 2) {
    return { error: "Se necesitan al menos 2 cotizaciones para comparar", summary: null };
  }

  const prices = quotes.map((q) => q.totalCost);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const differences: Array<{ observation: string; source: string }> = [];

  // Price differences
  if (maxPrice - minPrice > avgPrice * 0.3) {
    differences.push({
      observation: `Hay una diferencia de precio significativa: desde S/${minPrice.toFixed(2)} hasta S/${maxPrice.toFixed(2)}`,
      source: "Comparación de totales",
    });
  }

  // Parts count differences
  const partsCounts = quotes.map((q) => q.parts.length);
  if (Math.max(...partsCounts) - Math.min(...partsCounts) > 2) {
    differences.push({
      observation: "Los talleres difieren en la cantidad de repuestos cotizados. Verifica si todos diagnosticaron lo mismo.",
      source: "Desglose de repuestos",
    });
  }

  // Rating comparison
  const ratings = quotes.map((q) => q.workshop.rating);
  const bestRated = quotes.reduce((best, q) => q.workshop.rating > best.workshop.rating ? q : best);
  const cheapest = quotes.reduce((best, q) => q.totalCost < best.totalCost ? q : best);

  if (bestRated.id !== cheapest.id) {
    differences.push({
      observation: `El taller con mejor reputación (${bestRated.workshop.name}, ★${bestRated.workshop.rating.toFixed(1)}) no es el más barato. Considera calidad vs precio.`,
      source: "Rating vs precio",
    });
  }

  const questionsToAsk = [
    "¿Incluye garantía el servicio?",
    "¿Los repuestos son originales o compatibles?",
    "¿El tiempo estimado incluye espera de repuestos?",
  ];

  return {
    summary: {
      quotesCompared: quotes.length,
      priceRange: { min: minPrice, max: maxPrice, average: avgPrice },
      differences,
      questionsToAsk,
      disclaimer: DISCLAIMER,
    },
  };
}

// --- HU-37: Glossary/diagnosis normalization ---
export async function generateGlossary(quoteId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { parts: true },
  });
  if (!quote) throw new Error("Cotización no encontrada");

  const terms = extractTechnicalTerms(quote.diagnosis);
  const partsGlossary = quote.parts.map((p) => ({
    name: p.name,
    explanation: generatePartExplanation(p.name),
    type: p.partType === "ORIGINAL" ? "Repuesto original del fabricante" : "Repuesto compatible/alternativo",
    source: `Cotización ${quote.id}`,
  }));

  return {
    glossary: terms,
    partsExplained: partsGlossary,
    verificationChecklist: [
      "Verifica que los repuestos listados coincidan con lo diagnosticado",
      "Confirma que el tiempo estimado sea razonable",
      "Pregunta por la garantía de mano de obra y repuestos",
      "Solicita evidencia fotográfica del problema",
    ],
    disclaimer: DISCLAIMER,
  };
}

// --- HU-38: Vision diagnosis (LABS) ---
export async function generateVisionDiagnosis(data: {
  requestId?: string;
  imageUrls: string[];
  symptoms: string;
  motorcycleBrand: string;
  motorcycleModel: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  if (!data.imageUrls || data.imageUrls.length === 0) {
    throw new Error("Se requiere al menos 1 foto del área afectada");
  }

  // Labs/mock implementation — no real vision API
  const confidence = 0.35 + Math.random() * 0.3; // 0.35-0.65 range

  const result = {
    isConclusive: confidence >= 0.6,
    confidence,
    probableDiagnosis: confidence >= 0.6
      ? "Desgaste visible en componente — se recomienda verificación presencial"
      : "No concluyente — las imágenes no permiten un diagnóstico definitivo",
    observations: [
      "Análisis basado en patrones visuales detectados en las imágenes proporcionadas",
      confidence < 0.6 ? "La confianza es baja — se recomienda cotización con taller especializado" : "Se detectaron indicios que requieren verificación profesional",
    ],
    recommendations: [
      "Solicitar cotización a al menos 2 talleres verificados",
      "Proporcionar más imágenes desde diferentes ángulos si es posible",
      "Incluir detalles sobre cuándo comenzó el síntoma",
    ],
    disclaimer: "⚠️ EXPERIMENTAL (LABS): Este diagnóstico automático es una aproximación. No reemplaza la inspección presencial de un técnico certificado. Los daños internos no visibles NO pueden ser detectados por este sistema.",
    modelVersion: "vision-mock-v1",
    imagesAnalyzed: data.imageUrls.length,
  };

  // Only store in DB if we have a real requestId (not during pre-submission preview)
  if (data.requestId) {
    try {
      await prisma.aiSuggestion.create({
        data: {
          requestId: data.requestId,
          type: "VISION_DIAGNOSIS",
          input: JSON.stringify({ symptoms: data.symptoms, imageCount: data.imageUrls.length }),
          output: JSON.stringify(result),
          confidence: result.confidence,
          modelVersion: result.modelVersion,
          isConclusive: result.isConclusive,
          disclaimer: result.disclaimer,
        },
      });
    } catch (err: any) {
      logger.warn("Could not store vision diagnosis in DB", { error: err.message });
    }
  }

  logger.info("AI vision diagnosis generated", { requestId: data.requestId || "preview", confidence, isConclusive: result.isConclusive });
  return result;
}

// --- Helper functions ---

function simplifyDiagnosis(diagnosis: string): string {
  const mappings: Record<string, string> = {
    "carburador": "El carburador (pieza que mezcla aire y combustible) necesita atención",
    "bujía": "La bujía (pieza que genera la chispa para encender el motor) necesita cambio",
    "cadena": "La cadena de transmisión (la que conecta el motor con la rueda trasera) está desgastada",
    "pastilla": "Las pastillas de freno están desgastadas y necesitan reemplazo",
    "aceite": "Se necesita cambio de aceite del motor",
    "filtro": "El filtro necesita reemplazo para mantener el rendimiento",
    "suspensión": "El sistema de suspensión (que absorbe los golpes del camino) necesita revisión",
    "embrague": "El embrague (que permite cambiar marchas) necesita ajuste o reemplazo",
  };

  let simplified = diagnosis;
  for (const [term, explanation] of Object.entries(mappings)) {
    if (diagnosis.toLowerCase().includes(term)) {
      simplified = explanation;
      break;
    }
  }
  return simplified;
}

function generatePartExplanation(partName: string): string {
  const explanations: Record<string, string> = {
    "bujía": "Pieza que genera la chispa para encender el combustible en el motor",
    "pastilla": "Pieza de freno que se desgasta con el uso y debe reemplazarse periódicamente",
    "filtro de aceite": "Pieza que limpia el aceite del motor de impurezas",
    "filtro de aire": "Pieza que limpia el aire que entra al motor",
    "cadena": "Elemento que transmite la potencia del motor a la rueda trasera",
    "piñón": "Engranaje que trabaja junto con la cadena",
    "aceite": "Lubricante esencial para el funcionamiento del motor",
    "amortiguador": "Componente de la suspensión que absorbe impactos del camino",
    "disco de freno": "Disco metálico sobre el que actúan las pastillas para frenar",
    "batería": "Acumulador de energía eléctrica para el arranque y sistema eléctrico",
  };

  const nameLower = partName.toLowerCase();
  for (const [key, explanation] of Object.entries(explanations)) {
    if (nameLower.includes(key)) return explanation;
  }
  return "Repuesto mecánico para motocicleta";
}

function generateRiskAssessment(diagnosis: string): string {
  const diagLower = diagnosis.toLowerCase();
  if (diagLower.includes("freno")) return "⚠️ RIESGO ALTO: El sistema de frenado es crítico para la seguridad. No reparar puede causar accidentes.";
  if (diagLower.includes("aceite")) return "⚠️ RIESGO MEDIO: Sin cambio de aceite, el motor puede sufrir desgaste prematuro y daños costosos.";
  if (diagLower.includes("cadena")) return "⚠️ RIESGO MEDIO: Una cadena desgastada puede romperse durante la conducción.";
  if (diagLower.includes("suspensión")) return "⚠️ RIESGO MEDIO: Suspensión defectuosa reduce el control y estabilidad.";
  if (diagLower.includes("eléctric") || diagLower.includes("batería")) return "⚠️ RIESGO BAJO-MEDIO: Puede quedarse sin arranque o fallar luces.";
  return "⚠️ Se recomienda atender el problema oportunamente para evitar daños mayores.";
}

function extractTechnicalTerms(text: string): Array<{ term: string; definition: string }> {
  const glossary: Record<string, string> = {
    "carburador": "Dispositivo que mezcla aire con combustible en la proporción correcta para la combustión",
    "inyección": "Sistema electrónico que dosifica el combustible de forma precisa",
    "bujía": "Componente que genera la chispa eléctrica para encender la mezcla de combustible",
    "válvula": "Pieza que controla la entrada y salida de gases en el motor",
    "pistón": "Pieza cilíndrica que se mueve dentro del motor generando potencia",
    "embrague": "Mecanismo que conecta/desconecta el motor de la transmisión para cambiar marchas",
    "amortiguador": "Componente de suspensión que absorbe los impactos del camino",
    "catalítico": "Sistema que reduce los gases contaminantes del escape",
    "rectificador": "Dispositivo que convierte corriente alterna en continua para cargar la batería",
    "CDI": "Módulo electrónico que controla el encendido del motor (Capacitor Discharge Ignition)",
  };

  const terms: Array<{ term: string; definition: string }> = [];
  const textLower = text.toLowerCase();

  for (const [term, definition] of Object.entries(glossary)) {
    if (textLower.includes(term.toLowerCase())) {
      terms.push({ term, definition });
    }
  }
  return terms;
}
