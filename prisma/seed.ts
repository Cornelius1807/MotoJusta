import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL no definida");
console.log("📡 Conectando a:", dbUrl.substring(0, 50) + "...");

const pool = new pg.Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding MotoJusta database...\n");

  // ── Categories ──────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: "motor" }, update: {}, create: { name: "Motor", slug: "motor", description: "Problemas de motor, ruidos, humo, pérdida de potencia" } }),
    prisma.category.upsert({ where: { slug: "frenos" }, update: {}, create: { name: "Frenos", slug: "frenos", description: "Pastillas, discos, líquido, ABS" } }),
    prisma.category.upsert({ where: { slug: "suspension" }, update: {}, create: { name: "Suspensión", slug: "suspension", description: "Amortiguadores, horquilla, resortes" } }),
    prisma.category.upsert({ where: { slug: "electrico" }, update: {}, create: { name: "Sistema eléctrico", slug: "electrico", description: "Batería, luces, arranque, alternador" } }),
    prisma.category.upsert({ where: { slug: "transmision" }, update: {}, create: { name: "Transmisión", slug: "transmision", description: "Cadena, piñones, embrague" } }),
    prisma.category.upsert({ where: { slug: "neumaticos" }, update: {}, create: { name: "Neumáticos", slug: "neumaticos", description: "Cambio, parchado, balanceo" } }),
    prisma.category.upsert({ where: { slug: "mantenimiento" }, update: {}, create: { name: "Mantenimiento general", slug: "mantenimiento", description: "Aceite, filtros, revisión periódica" } }),
    prisma.category.upsert({ where: { slug: "carroceria" }, update: {}, create: { name: "Carrocería", slug: "carroceria", description: "Carenado, pintura, espejos, asiento" } }),
  ]);
  console.log(`✅ ${categories.length} categorías creadas`);

  // ── Guide Questions ─────────────────────────────────────────
  const motorCat = categories[0];
  const frenosCat = categories[1];

  const questions = await Promise.all([
    prisma.guideQuestion.upsert({
      where: { id: "gq-motor-1" },
      update: {},
      create: { id: "gq-motor-1", categoryId: motorCat.id, question: "¿El motor enciende?", options: JSON.stringify(["Sí, normal", "Sí, con dificultad", "No enciende"]), order: 1 },
    }),
    prisma.guideQuestion.upsert({
      where: { id: "gq-motor-2" },
      update: {},
      create: { id: "gq-motor-2", categoryId: motorCat.id, question: "¿Escuchas algún ruido inusual?", options: JSON.stringify(["No", "Golpeteo", "Silbido", "Traqueteo"]), order: 2 },
    }),
    prisma.guideQuestion.upsert({
      where: { id: "gq-motor-3" },
      update: {},
      create: { id: "gq-motor-3", categoryId: motorCat.id, question: "¿Ves humo del escape?", options: JSON.stringify(["No", "Blanco", "Negro", "Azul"]), order: 3 },
    }),
    prisma.guideQuestion.upsert({
      where: { id: "gq-frenos-1" },
      update: {},
      create: { id: "gq-frenos-1", categoryId: frenosCat.id, question: "¿Cuál freno presenta el problema?", options: JSON.stringify(["Delantero", "Trasero", "Ambos"]), order: 1 },
    }),
    prisma.guideQuestion.upsert({
      where: { id: "gq-frenos-2" },
      update: {},
      create: { id: "gq-frenos-2", categoryId: frenosCat.id, question: "¿Escuchas algún sonido al frenar?", options: JSON.stringify(["No", "Chirrido", "Roce metálico"]), order: 2 },
    }),
    prisma.guideQuestion.upsert({
      where: { id: "gq-frenos-3" },
      update: {},
      create: { id: "gq-frenos-3", categoryId: frenosCat.id, question: "¿La palanca/pedal se siente esponjoso?", options: JSON.stringify(["Sí", "No", "Intermitente"]), order: 3 },
    }),
  ]);
  console.log(`✅ ${questions.length} preguntas guía creadas`);

  // ── Demo Users ──────────────────────────────────────────────
  const demoMoto = await prisma.userProfile.upsert({
    where: { clerkUserId: "demo_motorcyclist" },
    update: {},
    create: {
      clerkUserId: "demo_motorcyclist",
      email: "motociclista@demo.motojusta.com",
      name: "Juan Pérez",
      role: "MOTOCICLISTA",
      district: "Miraflores",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  const demoWorkshopOwner = await prisma.userProfile.upsert({
    where: { clerkUserId: "demo_workshop" },
    update: {},
    create: {
      clerkUserId: "demo_workshop",
      email: "taller@demo.motojusta.com",
      name: "Carlos Mendoza",
      role: "TALLER",
      district: "San Isidro",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  const demoAdmin = await prisma.userProfile.upsert({
    where: { clerkUserId: "demo_admin" },
    update: {},
    create: {
      clerkUserId: "demo_admin",
      email: "admin@demo.motojusta.com",
      name: "Admin MotoJusta",
      role: "ADMIN",
      district: "Lima",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  const demoWorkshopOwner2 = await prisma.userProfile.upsert({
    where: { clerkUserId: "demo_workshop_2" },
    update: {},
    create: {
      clerkUserId: "demo_workshop_2",
      email: "taller2@demo.motojusta.com",
      name: "Luis García",
      role: "TALLER",
      district: "Miraflores",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });
  console.log("✅ 4 usuarios demo creados");

  // ── Demo Motorcycles ────────────────────────────────────────
  const moto1 = await prisma.motorcycle.upsert({
    where: { id: "demo-moto-1" },
    update: {},
    create: {
      id: "demo-moto-1",
      userId: demoMoto.id,
      brand: "Honda",
      model: "CB 190R",
      year: 2023,
      displacement: 184,
      use: "DIARIO",
      kmApprox: 8500,
      alias: "Mi Honda",
    },
  });

  const moto2 = await prisma.motorcycle.upsert({
    where: { id: "demo-moto-2" },
    update: {},
    create: {
      id: "demo-moto-2",
      userId: demoMoto.id,
      brand: "Yamaha",
      model: "FZ 250",
      year: 2022,
      displacement: 249,
      use: "MIXTO",
      kmApprox: 15000,
    },
  });
  console.log("✅ 2 motos demo creadas");

  // ── Demo Workshop ───────────────────────────────────────────
  const workshop1 = await prisma.workshop.upsert({
    where: { id: "demo-workshop-1" },
    update: {},
    create: {
      id: "demo-workshop-1",
      userId: demoWorkshopOwner.id,
      name: "MotoFix Pro",
      district: "San Isidro",
      address: "Av. Javier Prado 1234",
      phone: "999888777",
      description: "Taller especializado en motos japonesas con más de 10 años de experiencia.",
      status: "VERIFICADO",
      rating: 4.8,
    },
  });

  const workshop2 = await prisma.workshop.upsert({
    where: { id: "demo-workshop-2" },
    update: {},
    create: {
      id: "demo-workshop-2",
      userId: demoWorkshopOwner2.id,
      name: "Taller MotoSpeed",
      district: "Miraflores",
      address: "Calle Los Eucaliptos 567",
      phone: "998877665",
      description: "Servicio rápido y profesional para todo tipo de motos.",
      status: "VERIFICADO",
      rating: 4.5,
    },
  });

  // Workshop categories
  await prisma.workshopCategory.createMany({
    data: [
      { workshopId: workshop1.id, categoryId: motorCat.id },
      { workshopId: workshop1.id, categoryId: frenosCat.id },
      { workshopId: workshop1.id, categoryId: categories[6].id }, // mantenimiento
      { workshopId: workshop2.id, categoryId: frenosCat.id },
      { workshopId: workshop2.id, categoryId: categories[2].id }, // suspension
    ],
    skipDuplicates: true,
  });
  console.log("✅ 2 talleres demo creados");

  // ── Demo Service Request ────────────────────────────────────
  const request1 = await prisma.serviceRequest.upsert({
    where: { id: "demo-request-1" },
    update: {},
    create: {
      id: "demo-request-1",
      userId: demoMoto.id,
      motorcycleId: moto1.id,
      categoryId: frenosCat.id,
      description: "Las pastillas de freno delanteras hacen un ruido metálico al frenar fuerte. El problema empezó hace unos días y es constante.",
      district: "Miraflores",
      urgency: "MEDIA",
      status: "EN_COTIZACION",
    },
  });

  const request2 = await prisma.serviceRequest.upsert({
    where: { id: "demo-request-2" },
    update: {},
    create: {
      id: "demo-request-2",
      userId: demoMoto.id,
      motorcycleId: moto2.id,
      categoryId: motorCat.id,
      description: "Pérdida de potencia al acelerar en segunda marcha, se siente tirones. También noto un leve humo azulado.",
      district: "Miraflores",
      urgency: "ALTA",
      status: "PUBLICADA",
    },
  });
  console.log("✅ 2 solicitudes demo creadas");

  // ── Demo Quotes ─────────────────────────────────────────────
  const quote1 = await prisma.quote.upsert({
    where: { id: "demo-quote-1" },
    update: {},
    create: {
      id: "demo-quote-1",
      requestId: request1.id,
      workshopId: workshop1.id,
      diagnosis: "Pastillas de freno delanteras desgastadas, requieren reemplazo.",
      laborCost: 70,
      totalParts: 85,
      totalCost: 155,
      estimatedTime: "1 día",
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: "Tenemos pastillas genéricas de alta calidad. Trabajo garantizado.",
      status: "ENVIADA",
    },
  });

  await prisma.quotePartItem.createMany({
    data: [
      { quoteId: quote1.id, name: "Pastillas genéricas premium", partType: "ALTERNATIVO", unitPrice: 85, quantity: 1 },
    ],
    skipDuplicates: true,
  });

  const quote2 = await prisma.quote.upsert({
    where: { id: "demo-quote-2" },
    update: {},
    create: {
      id: "demo-quote-2",
      requestId: request1.id,
      workshopId: workshop2.id,
      diagnosis: "Desgaste en pastillas de freno delanteras, reemplazo recomendado con Brembo.",
      laborCost: 60,
      totalParts: 120,
      totalCost: 180,
      estimatedTime: "2 días",
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: "Podemos recibir tu moto mañana. Las pastillas Brembo son las mejores para tu modelo.",
      status: "ENVIADA",
    },
  });

  await prisma.quotePartItem.createMany({
    data: [
      { quoteId: quote2.id, name: "Pastillas de freno Brembo", partType: "ORIGINAL", unitPrice: 120, quantity: 1 },
    ],
    skipDuplicates: true,
  });
  console.log("✅ 2 cotizaciones demo creadas");

  // ── Status History ──────────────────────────────────────────
  await prisma.requestStatusHistory.createMany({
    data: [
      { requestId: request1.id, fromStatus: "BORRADOR", toStatus: "PUBLICADA", actorId: demoMoto.id },
      { requestId: request1.id, fromStatus: "PUBLICADA", toStatus: "EN_COTIZACION", actorId: demoMoto.id },
      { requestId: request2.id, fromStatus: "BORRADOR", toStatus: "PUBLICADA", actorId: demoMoto.id },
    ],
    skipDuplicates: true,
  });

  // ── Feature Flags ───────────────────────────────────────────
  const featureFlags = [
    { key: "hu-01", name: "Aceptar términos", enabled: true },
    { key: "hu-02", name: "Registro con Clerk", enabled: true },
    { key: "hu-03", name: "Completar perfil", enabled: true },
    { key: "hu-04", name: "Registrar moto", enabled: true },
    { key: "hu-05", name: "Crear solicitud", enabled: true },
    { key: "hu-06", name: "Categorías de servicio", enabled: true },
    { key: "hu-07", name: "Guía de preguntas", enabled: true },
    { key: "hu-08", name: "Adjuntar fotos/videos", enabled: true },
    { key: "hu-09", name: "Estado de solicitud", enabled: true },
    { key: "hu-10", name: "Registro de taller", enabled: true },
    { key: "hu-11", name: "Verificación de taller", enabled: true },
    { key: "hu-12", name: "Panel de solicitudes", enabled: true },
    { key: "hu-13", name: "Cotización detallada", enabled: true },
    { key: "hu-14", name: "Alternativas de repuestos", enabled: true },
    { key: "hu-15", name: "Comparador de cotizaciones", enabled: true },
    { key: "hu-16", name: "Chat contextual", enabled: true },
    { key: "hu-17", name: "Notificaciones", enabled: true },
    { key: "hu-18", name: "Historial de servicios", enabled: true },
    { key: "hu-19", name: "Orden de trabajo", enabled: true },
    { key: "hu-20", name: "Timeline de servicio", enabled: false },
    { key: "hu-21", name: "Evidencia fotográfica", enabled: false },
    { key: "hu-22", name: "Solicitud de cambio", enabled: true },
    { key: "hu-23", name: "Recibo digital", enabled: false },
    { key: "hu-24", name: "Calificar servicio", enabled: true },
    { key: "hu-25", name: "Reseñas públicas", enabled: false },
    { key: "hu-26", name: "Calificación del motociclista", enabled: false },
    { key: "hu-27", name: "Reportar incidente", enabled: false },
    { key: "hu-28", name: "Gestión de incidentes", enabled: false },
    { key: "hu-29", name: "Audit log", enabled: false },
    { key: "hu-30", name: "Dashboard admin", enabled: false },
    { key: "hu-31", name: "Moderación de contenido", enabled: false },
    { key: "hu-32", name: "Métricas de plataforma", enabled: false },
    { key: "hu-33", name: "AI: Diagnóstico", enabled: false },
    { key: "hu-34", name: "AI: Estimación", enabled: false },
    { key: "hu-35", name: "AI: Análisis cotización", enabled: false },
    { key: "hu-36", name: "AI: Recomendación taller", enabled: false },
    { key: "hu-37", name: "AI: Maintenance predictor", enabled: false },
    { key: "hu-38", name: "AI: Chat bot", enabled: false },
  ];

  for (const ff of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: ff.key },
      update: {},
      create: ff,
    });
  }
  console.log(`✅ ${featureFlags.length} feature flags creados`);

  // ── App Config ──────────────────────────────────────────────
  const configs = [
    { key: "app.name", value: "MotoJusta" },
    { key: "app.version", value: "1.0.0-beta" },
    { key: "app.mode", value: "demo" },
    { key: "quote.max_per_request", value: "10" },
    { key: "request.max_photos", value: "5" },
    { key: "review.min_comment_length_low_rating", value: "20" },
    { key: "change_request.min_justification_length", value: "20" },
  ];

  for (const c of configs) {
    await prisma.appConfig.upsert({
      where: { key: c.key },
      update: {},
      create: c,
    });
  }
  console.log(`✅ ${configs.length} configuraciones creadas`);

  console.log("\n🎉 Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
