import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    logger.error("Missing CLERK_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: any;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    logger.error("Webhook verification failed", { error: err });
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses?.[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(" ") || "Usuario";

    try {
      await prisma.userProfile.create({
        data: {
          clerkUserId: id,
          email: email || "",
          name,
          role: "MOTOCICLISTA",
        },
      });
      logger.info("User profile created from webhook", { clerkUserId: id });
    } catch (err) {
      logger.error("Failed to create user profile", { error: err, clerkUserId: id });
    }
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses?.[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(" ");

    try {
      await prisma.userProfile.update({
        where: { clerkUserId: id },
        data: {
          ...(email ? { email } : {}),
          ...(name ? { name } : {}),
        },
      });
      logger.info("User profile updated from webhook", { clerkUserId: id });
    } catch (err) {
      logger.error("Failed to update user profile", { error: err, clerkUserId: id });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    try {
      await prisma.userProfile.delete({ where: { clerkUserId: id } });
      logger.info("User profile deleted from webhook", { clerkUserId: id });
    } catch (err) {
      logger.error("Failed to delete user profile", { error: err, clerkUserId: id });
    }
  }

  return NextResponse.json({ received: true });
}
