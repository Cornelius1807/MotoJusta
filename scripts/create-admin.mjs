/**
 * Script to create a default admin account in Clerk + Database.
 * Run: node scripts/create-admin.mjs
 */
import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const ADMIN_EMAIL = "admin@motojusta.pe";
const ADMIN_PASSWORD = "MotoJusta2026!";
const ADMIN_FIRST_NAME = "Admin";
const ADMIN_LAST_NAME = "MotoJusta";

async function main() {
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const dbUrl = process.env.DATABASE_URL;
  if (!clerkSecret) throw new Error("CLERK_SECRET_KEY no definida en .env");
  if (!dbUrl) throw new Error("DATABASE_URL no definida en .env");

  console.log("🔑 Creando usuario admin en Clerk...");

  // 1. Create Clerk user via Backend API
  const createRes = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clerkSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [ADMIN_EMAIL],
      password: ADMIN_PASSWORD,
      first_name: ADMIN_FIRST_NAME,
      last_name: ADMIN_LAST_NAME,
      username: "admin_motojusta",
      skip_password_checks: true,
    }),
  });

  let clerkUserId;

  if (createRes.ok) {
    const user = await createRes.json();
    clerkUserId = user.id;
    console.log(`✅ Usuario Clerk creado: ${clerkUserId}`);
  } else {
    const err = await createRes.json();
    // Check if user already exists (email taken)
    if (err.errors?.some((e) => e.code === "form_identifier_exists")) {
      console.log("⚠️  El usuario ya existe en Clerk, buscando...");
      // Find existing user by email
      const searchRes = await fetch(
        `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(ADMIN_EMAIL)}`,
        {
          headers: { Authorization: `Bearer ${clerkSecret}` },
        }
      );
      const users = await searchRes.json();
      if (users.length === 0) throw new Error("No se encontró el usuario existente");
      clerkUserId = users[0].id;
      console.log(`✅ Usuario Clerk encontrado: ${clerkUserId}`);
    } else {
      console.error("Error de Clerk:", JSON.stringify(err, null, 2));
      throw new Error("No se pudo crear el usuario en Clerk");
    }
  }

  // 2. Create/update UserProfile in database with ADMIN role
  console.log("📡 Conectando a base de datos...");
  const pool = new pg.Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const profile = await prisma.userProfile.upsert({
    where: { clerkUserId },
    update: { role: "ADMIN", email: ADMIN_EMAIL, name: `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}` },
    create: {
      clerkUserId,
      email: ADMIN_EMAIL,
      name: `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`,
      role: "ADMIN",
      termsAccepted: true,
      termsVersion: "1.0",
      termsAcceptedAt: new Date(),
    },
  });

  console.log(`\n✅ Admin creado exitosamente!`);
  console.log(`   ID: ${profile.id}`);
  console.log(`   Clerk ID: ${clerkUserId}`);
  console.log(`   Email: ${profile.email}`);
  console.log(`   Rol: ${profile.role}`);

  // 3. Verify
  const check = await prisma.userProfile.findUnique({ where: { clerkUserId } });
  console.log(`\n🔍 Verificación: role = ${check?.role}`);
  if (check?.role === "ADMIN") {
    console.log("✅ ROL ADMIN CONFIRMADO\n");
  } else {
    console.error("❌ ERROR: El rol no es ADMIN\n");
  }

  console.log("═══════════════════════════════════════════");
  console.log("  CREDENCIALES DE ADMINISTRADOR");
  console.log("═══════════════════════════════════════════");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  URL:      https://motojusta.vercel.app/admin-login`);
  console.log("═══════════════════════════════════════════\n");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
