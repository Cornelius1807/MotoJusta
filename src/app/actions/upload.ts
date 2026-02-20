"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

type UploadBucket = "request-media" | "evidence-media" | "profile-avatars";

export async function uploadFile(
  formData: FormData,
  bucket: UploadBucket,
  folder?: string
): Promise<{ url: string; mediaType: "IMAGE" | "VIDEO"; fileName: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No se proporcionó archivo");

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    throw new Error("Tipo de archivo no permitido. Use: JPEG, PNG, WebP, MP4");
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new Error("La imagen excede el límite de 5MB");
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    throw new Error("El video excede el límite de 50MB");
  }

  const supabase = getSupabaseAdmin();
  const ext = file.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const path = folder
    ? `${folder}/${userId}_${timestamp}.${ext}`
    : `${userId}_${timestamp}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    logger.error("File upload failed", { error: error.message, bucket, path });
    throw new Error("Error al subir archivo: " + error.message);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  logger.info("File uploaded", { bucket, path: data.path, size: file.size });

  return {
    url: urlData.publicUrl,
    mediaType: isImage ? "IMAGE" : "VIDEO",
    fileName: file.name,
  };
}
