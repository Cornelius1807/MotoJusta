/**
 * Script to delete old admin and recreate with a real email.
 * Run: node scripts/recreate-admin.mjs
 */
import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const OLD_CLERK_USER_ID = "user_39zf4P5qPqlqXpWE4UhYtdPDjcS";

const NEW_EMAIL = "mmatiasac18@gmail.com";
const NEW_PASSWORD = "MotoJusta2026!";
const NEW_FIRST_NAME = "Matias";
const NEW_LAST_NAME = "Admin";
const NEW_USERNAME = "admin_motojusta2";

async function main() {
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const dbUrl = process.env.DATABASE_URL;
  if (!clerkSecret) throw new Error("CLERK_SECRET_KEY no definida en .env");
  if (!dbUrl) throw new Error("DATABASE_URL no definida en .env");

  // 1. Delete old admin from Clerk
  console.log("🗑️  Eliminando usuario admin anterior de Clerk...");
  const delRes = await fetch(`https://api.clerk.com/v1/users/${OLD_CLERK_USER_ID}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${clerkSecret}` },
  });
  if (delRes.ok) {
    console.log("✅ Usuario anterior eliminado de Clerk");
  } else {
    const err = await delRes.json();
    console.warn("⚠️  No se pudo eliminar (puede que ya no exista):", err.errors?.[0]?.message || JSON.stringify(err));
  }

  // 2. Delete old profile from DB
  console.log("🗑️  Eliminando perfil anterior de la base de datos...");
  const pool = new pg.Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.userProfile.delete({ where: { clerkUserId: OLD_CLERK_USER_ID } });
    console.log("✅ Perfil anterior eliminado de DB");
  } catch (e) {
    console.warn("⚠️  Perfil no encontrado en DB (puede que ya fue eliminado)");
  }

  // 3. Create new Clerk user with real email
  console.log(`\n🔑 Creando nuevo usuario admin con email: ${NEW_EMAIL}`);
  const createRes = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clerkSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [NEW_EMAIL],
      password: NEW_PASSWORD,
      first_name: NEW_FIRST_NAME,
      last_name: NEW_LAST_NAME,
      username: NEW_USERNAME,
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
    if (err.errors?.some((e) => e.code === "form_identifier_exists")) {
      console.log("⚠️  El email ya existe en Clerk, buscando...");
      const searchRes = await fetch(
        `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(NEW_EMAIL)}`,
        { headers: { Authorization: `Bearer ${clerkSecret}` } }
      );
      const users = await searchRes.json();
      if (users.length === 0) throw new Error("No se encontró el usuario");
      clerkUserId = users[0].id;
      console.log(`✅ Usuario Clerk encontrado: ${clerkUserId}`);
    } else {
      console.error("Error de Clerk:", JSON.stringify(err, null, 2));
      throw new Error("No se pudo crear el usuario en Clerk");
    }
  }

  // 4. Create UserProfile with ADMIN role
  const profile = await prisma.userProfile.upsert({
    where: { clerkUserId },
    update: { role: "ADMIN", email: NEW_EMAIL, name: `${NEW_FIRST_NAME} ${NEW_LAST_NAME}` },
    create: {
      clerkUserId,
      email: NEW_EMAIL,
      name: `${NEW_FIRST_NAME} ${NEW_LAST_NAME}`,
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

  // 5. Verify
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
  console.log(`  Email:    ${NEW_EMAIL}`);
  console.log(`  Password: ${NEW_PASSWORD}`);
  console.log(`  URL:      https://motojusta.vercel.app/admin-login`);
  console.log("═══════════════════════════════════════════\n");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
