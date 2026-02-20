import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MotoJusta database...\n");

  // ── Categories ──────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: "motor" }, update: {}, create: { name: "Motor", slug: "motor", description: "Problemas de motor, ruidos, humo, pérdida de potencia", icon: "engine" } }),
    prisma.category.upsert({ where: { slug: "frenos" }, update: {}, create: { name: "Frenos", slug: "frenos", description: "Pastillas, discos, líquido, ABS", icon: "disc" } }),
    prisma.category.upsert({ where: { slug: "suspension" }, update: {}, create: { name: "Suspensión", slug: "suspension", description: "Amortiguadores, horquilla, resortes", icon: "spring" } }),
    prisma.category.upsert({ where: { slug: "electrico" }, update: {}, create: { name: "Sistema eléctrico", slug: "electrico", description: "Batería, luces, arranque, alternador", icon: "zap" } }),
    prisma.category.upsert({ where: { slug: "transmision" }, update: {}, create: { name: "Transmisión", slug: "transmision", description: "Cadena, piñones, embrague", icon: "link" } }),
    prisma.category.upsert({ where: { slug: "neumaticos" }, update: {}, create: { name: "Neumáticos", slug: "neumaticos", description: "Cambio, parchado, balanceo", icon: "circle" } }),
    prisma.category.upsert({ where: { slug: "mantenimiento" }, update: {}, create: { name: "Mantenimiento general", slug: "mantenimiento", description: "Aceite, filtros, revisión periódica", icon: "wrench" } }),
    prisma.category.upsert({ where: { slug: "carroceria" }, update: {}, create: { name: "Carrocería", slug: "carroceria", description: "Carenado, pintura, espejos, asiento", icon: "shield" } }),
  ]);
  console.log(`✅ ${categories.length} categorías creadas`);

  // ── Guide Questions ─────────────────────────────────────────
  const motorCat = categories[0];
  const frenosCat = categories[1];

  const questions = await Promise.all([
    prisma.guideQuestion.upsert({
      where: { id: "gq-motor-1" },
      update: {},
      create: { id: "gq-motor-1", categoryId: motorCat.id, question: "¿El motor enciende?", options: ["Sí, normal", "Sí, con dificultad", "No enciende"], order: 1 },
    }),
    prisma.guideQuestion.upsert({
      where: { id: "gq-motor-2" },
      update: {},
      create: { id: "gq-motor-2", categoryId: motorCat.id, question: "¿Escuchas algún ruido inusual?", options: ["No", "Golpeteo", "Silbido", "Traqueteo"], order: 2 },
    }),
    prisma.guideQuestion.upsert({
      where: { id: "gq-motor-3" },
      update: {},
      create: { id: "gq-motor-3", categoryId: motorCat.id, question: "¿Ves humo del escape?", options: ["No", "Blanco", "Negro", "Azul"], order: 3 },
    }),
    prisma.guideQuestion.upsert({
      where: { id: "gq-frenos-1" },
      update: {},
      create: { id: "gq-frenos-1", categoryId: frenosCat.id, question: "¿Cuál freno presenta el problema?", options: ["Delantero", "Trasero", "Ambos"], order: 1 },
    }),
    prisma.guideQuestion.upsert({
      where: { id: "gq-frenos-2" },
      update: {},
      create: { id: "gq-frenos-2", categoryId: frenosCat.id, question: "¿Escuchas algún sonido al frenar?", options: ["No", "Chirrido", "Roce metálico"], order: 2 },
    }),
    prisma.guideQuestion.upsert({
      where: { id: "gq-frenos-3" },
      update: {},
      create: { id: "gq-frenos-3", categoryId: frenosCat.id, question: "¿La palanca/pedal se siente esponjoso?", options: ["Sí", "No", "Intermitente"], order: 3 },
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
      role: "MOTORCYCLIST",
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
      role: "WORKSHOP",
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
  console.log("✅ 3 usuarios demo creados");

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
      use: "DAILY",
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
      use: "MIXED",
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
      ownerId: demoWorkshopOwner.id,
      name: "MotoFix Pro",
      district: "San Isidro",
      address: "Av. Javier Prado 1234",
      phone: "999888777",
      description: "Taller especializado en motos japonesas con más de 10 años de experiencia.",
      status: "VERIFIED",
      verifiedAt: new Date(),
      rating: 4.8,
      reviewCount: 67,
    },
  });

  const workshop2 = await prisma.workshop.upsert({
    where: { id: "demo-workshop-2" },
    update: {},
    create: {
      id: "demo-workshop-2",
      ownerId: demoWorkshopOwner.id,
      name: "Taller MotoSpeed",
      district: "Miraflores",
      address: "Calle Los Eucaliptos 567",
      phone: "998877665",
      description: "Servicio rápido y profesional para todo tipo de motos.",
      status: "VERIFIED",
      verifiedAt: new Date(),
      rating: 4.5,
      reviewCount: 32,
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
      urgency: "MEDIUM",
      status: "QUOTED",
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
      urgency: "HIGH",
      status: "PUBLISHED",
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
      laborCost: 70,
      partsTotal: 85,
      totalPrice: 155,
      estimatedDays: 1,
      message: "Tenemos pastillas genéricas de alta calidad. Trabajo garantizado.",
      status: "PENDING",
    },
  });

  await prisma.quotePartItem.createMany({
    data: [
      { quoteId: quote1.id, name: "Pastillas genéricas premium", partType: "AFTERMARKET", unitPrice: 85, quantity: 1, subtotal: 85 },
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
      laborCost: 60,
      partsTotal: 120,
      totalPrice: 180,
      estimatedDays: 2,
      message: "Podemos recibir tu moto mañana. Las pastillas Brembo son las mejores para tu modelo.",
      status: "PENDING",
    },
  });

  await prisma.quotePartItem.createMany({
    data: [
      { quoteId: quote2.id, name: "Pastillas de freno Brembo", partType: "OEM", unitPrice: 120, quantity: 1, subtotal: 120 },
    ],
    skipDuplicates: true,
  });
  console.log("✅ 2 cotizaciones demo creadas");

  // ── Status History ──────────────────────────────────────────
  await prisma.statusHistory.createMany({
    data: [
      { requestId: request1.id, fromStatus: "DRAFT", toStatus: "PUBLISHED", changedById: demoMoto.id },
      { requestId: request1.id, fromStatus: "PUBLISHED", toStatus: "QUOTED", changedById: demoMoto.id },
      { requestId: request2.id, fromStatus: "DRAFT", toStatus: "PUBLISHED", changedById: demoMoto.id },
    ],
    skipDuplicates: true,
  });

  // ── Feature Flags ───────────────────────────────────────────
  const featureFlags = [
    { key: "hu-01", name: "Aceptar términos", isActive: true },
    { key: "hu-02", name: "Registro con Clerk", isActive: true },
    { key: "hu-03", name: "Completar perfil", isActive: true },
    { key: "hu-04", name: "Registrar moto", isActive: true },
    { key: "hu-05", name: "Crear solicitud", isActive: true },
    { key: "hu-06", name: "Categorías de servicio", isActive: true },
    { key: "hu-07", name: "Guía de preguntas", isActive: true },
    { key: "hu-08", name: "Adjuntar fotos/videos", isActive: true },
    { key: "hu-09", name: "Estado de solicitud", isActive: true },
    { key: "hu-10", name: "Registro de taller", isActive: true },
    { key: "hu-11", name: "Verificación de taller", isActive: true },
    { key: "hu-12", name: "Panel de solicitudes", isActive: true },
    { key: "hu-13", name: "Cotización detallada", isActive: true },
    { key: "hu-14", name: "Alternativas de repuestos", isActive: true },
    { key: "hu-15", name: "Comparador de cotizaciones", isActive: true },
    { key: "hu-16", name: "Chat contextual", isActive: true },
    { key: "hu-17", name: "Notificaciones", isActive: true },
    { key: "hu-18", name: "Historial de servicios", isActive: true },
    { key: "hu-19", name: "Orden de trabajo", isActive: true },
    { key: "hu-20", name: "Timeline de servicio", isActive: false },
    { key: "hu-21", name: "Evidencia fotográfica", isActive: false },
    { key: "hu-22", name: "Solicitud de cambio", isActive: true },
    { key: "hu-23", name: "Recibo digital", isActive: false },
    { key: "hu-24", name: "Calificar servicio", isActive: true },
    { key: "hu-25", name: "Reseñas públicas", isActive: false },
    { key: "hu-26", name: "Calificación del motociclista", isActive: false },
    { key: "hu-27", name: "Reportar incidente", isActive: false },
    { key: "hu-28", name: "Gestión de incidentes", isActive: false },
    { key: "hu-29", name: "Audit log", isActive: false },
    { key: "hu-30", name: "Dashboard admin", isActive: false },
    { key: "hu-31", name: "Moderación de contenido", isActive: false },
    { key: "hu-32", name: "Métricas de plataforma", isActive: false },
    { key: "hu-33", name: "AI: Diagnóstico", isActive: false },
    { key: "hu-34", name: "AI: Estimación", isActive: false },
    { key: "hu-35", name: "AI: Análisis cotización", isActive: false },
    { key: "hu-36", name: "AI: Recomendación taller", isActive: false },
    { key: "hu-37", name: "AI: Maintenance predictor", isActive: false },
    { key: "hu-38", name: "AI: Chat bot", isActive: false },
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
