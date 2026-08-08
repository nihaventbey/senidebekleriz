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
  saveBrandSettings,
  getBrandSettings,
  normalizeBrandSettings,
} from "@/lib/data/site-settings";

const ALLOWED_LOGO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

const ALLOWED_FAVICON_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/svg+xml") return "svg";
  if (mime === "image/x-icon" || mime === "image/vnd.microsoft.icon") {
    return "ico";
  }
  return "jpg";
}

async function uploadBrandAsset(
  file: File,
  kind: "logo" | "favicon" | "apple-touch" | "og",
  allowed: Set<string>
): Promise<string> {
  if (!allowed.has(file.type)) {
    throw new Error("Desteklenmeyen dosya türü.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Dosya 5MB'den büyük olamaz.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const path = `branding/${kind}-${Date.now()}.${extensionForMime(file.type)}`;

  const { error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw new Error(`Dosya yüklenemedi: ${error.message}`);

  return getMediaPublicUrl(path);
}

async function uploadHeroImage(file: File): Promise<string> {
  if (!ALLOWED_LOGO_MIME_TYPES.has(file.type)) {
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

async function resolveBrandAsset(options: {
  formData: FormData;
  clearKey: string;
  fileKey: string;
  urlKey: string;
  current: string | null;
  kind: "logo" | "favicon" | "apple-touch" | "og";
  allowed: Set<string>;
}): Promise<string | null> {
  const clearVal = options.formData.get(options.clearKey);
  if (clearVal === "on" || clearVal === "true" || clearVal === "1") return null;

  const file = options.formData.get(options.fileKey);
  if (file instanceof File && file.size > 0) {
    return uploadBrandAsset(file, options.kind, options.allowed);
  }

  const urlInput = options.formData.get(options.urlKey);
  if (typeof urlInput === "string") {
    const trimmed = urlInput.trim();
    if (trimmed) return trimmed;
    // If the input was explicitly submitted as empty string, clear it!
    if (urlInput === "" && options.current) return null;
  }

  return options.current;
}

export async function updateBrandSettings(
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    const current = await getBrandSettings();

    const settings = normalizeBrandSettings({
      logoUrl: await resolveBrandAsset({
        formData,
        clearKey: "clearLogo",
        fileKey: "logoFile",
        urlKey: "logoUrl",
        current: current.logoUrl,
        kind: "logo",
        allowed: ALLOWED_LOGO_MIME_TYPES,
      }),
      faviconUrl: await resolveBrandAsset({
        formData,
        clearKey: "clearFavicon",
        fileKey: "faviconFile",
        urlKey: "faviconUrl",
        current: current.faviconUrl,
        kind: "favicon",
        allowed: ALLOWED_FAVICON_MIME_TYPES,
      }),
      appleTouchIconUrl: await resolveBrandAsset({
        formData,
        clearKey: "clearAppleTouchIcon",
        fileKey: "appleTouchIconFile",
        urlKey: "appleTouchIconUrl",
        current: current.appleTouchIconUrl,
        kind: "apple-touch",
        allowed: ALLOWED_FAVICON_MIME_TYPES,
      }),
      ogImageUrl: await resolveBrandAsset({
        formData,
        clearKey: "clearOgImage",
        fileKey: "ogImageFile",
        urlKey: "ogImageUrl",
        current: current.ogImageUrl,
        kind: "og",
        allowed: ALLOWED_LOGO_MIME_TYPES,
      }),
    });

    const result = await saveBrandSettings(settings);
    if (result.error) {
      return { error: `Marka ayarları kaydedilemedi: ${result.error}` };
    }

    revalidatePath("/");
    revalidatePath("/yonetim/gorunum");

    return { success: "Logo ve favicon ayarları kaydedildi." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Bilinmeyen hata oluştu.",
    };
  }
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
