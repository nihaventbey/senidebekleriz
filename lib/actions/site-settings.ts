"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  MEDIA_BUCKET,
  getMediaPublicUrl,
} from "@/lib/storage/upload-image-from-url";
import {
  normalizeHeroSettings,
  saveHeroSettings,
} from "@/lib/data/site-settings";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

async function uploadHeroImage(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Sadece JPEG, PNG veya WebP yükleyebilirsiniz.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Görsel 5MB'den büyük olamaz.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const path = `hero/background-${Date.now()}.${extensionForMime(file.type)}`;

  const { error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw new Error(`Görsel yüklenemedi: ${error.message}`);

  return getMediaPublicUrl(path);
}

export async function updateHeroSettings(
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    let imageUrl = ((formData.get("imageUrl") as string) || "").trim() || null;

    const file = formData.get("imageFile");
    if (file instanceof File && file.size > 0) {
      imageUrl = await uploadHeroImage(file);
    }

    const settings = normalizeHeroSettings({
      enabled: formData.get("enabled") === "on",
      imageUrl,
      effect: formData.get("effect"),
      overlayTone: formData.get("overlayTone"),
      overlayOpacity: Number(formData.get("overlayOpacity")),
      blur: Number(formData.get("blur")),
    });

    if (settings.enabled && !settings.imageUrl) {
      return {
        error: "Arka planı etkinleştirmek için bir görsel yükleyin veya URL girin.",
      };
    }

    const result = await saveHeroSettings(settings);
    if (result.error) {
      return { error: `Ayarlar kaydedilemedi: ${result.error}` };
    }

    revalidatePath("/");
    revalidatePath("/yonetim/gorunum");

    return { success: "Hero ayarları kaydedildi." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Bilinmeyen hata oluştu.",
    };
  }
}
