import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BROWSER_USER_AGENT } from "@/lib/ai/extract-page-images";

export const MEDIA_BUCKET = "media";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const WEBP_QUALITY = 82;

export function getMediaPublicUrl(path: string): string {
  const { data } = supabaseAdmin.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function safePathSegment(value: string): string {
  return value
    .replace(/[^a-z0-9-]/gi, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
}

function normalizeWebpStoragePath(
  storagePathOrOptions:
    | string
    | {
        folder: "news" | "events" | "articles" | "places" | "uploads";
        slugHint?: string;
      }
): string {
  if (typeof storagePathOrOptions === "string") {
    const withoutExt = storagePathOrOptions.replace(/\.(jpe?g|png|webp|avif|gif)$/i, "");
    return `${withoutExt}.webp`;
  }
  const safeSlug = safePathSegment(storagePathOrOptions.slugHint || "cover") || "cover";
  return `${storagePathOrOptions.folder}/${safeSlug}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 6)}.webp`;
}

/**
 * Strips all EXIF/ICC/XMP metadata (after auto-orienting via EXIF orientation tag),
 * resizes oversized dimensions down to MAX_IMAGE_DIMENSION, and encodes as WebP.
 */
export async function convertBufferToCleanWebp(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer, { failOn: "none" })
    .rotate() // Auto-orient based on EXIF before stripping metadata
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();
}

export async function uploadImageBuffer(
  bytes: Buffer,
  contentType: string,
  storagePathOrOptions:
    | string
    | {
        folder: "news" | "events" | "articles" | "places" | "uploads";
        slugHint?: string;
      }
): Promise<string | null> {
  const mime = (contentType || "image/jpeg").split(";")[0].trim().toLowerCase();
  if (
    !ALLOWED_MIME_TYPES.has(mime) &&
    !mime.startsWith("image/") &&
    !mime.includes("octet-stream")
  ) {
    return null;
  }
  if (!bytes || bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;

  let webpBytes: Buffer;
  try {
    webpBytes = await convertBufferToCleanWebp(bytes);
  } catch (err) {
    console.error("[Storage] convertBufferToCleanWebp error:", err);
    return null;
  }

  const pathWithWebp = normalizeWebpStoragePath(storagePathOrOptions);

  const { error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .upload(pathWithWebp, webpBytes, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: true,
    });

  if (error) {
    console.error("uploadImageBuffer error:", error.message);
    return null;
  }

  return getMediaPublicUrl(pathWithWebp);
}

export async function uploadImageFromUrl(
  imageUrl: string,
  storagePathOrOptions:
    | string
    | {
        folder: "news" | "events" | "articles" | "places" | "uploads";
        slugHint?: string;
        forceReprocess?: boolean;
      }
): Promise<string | null> {
  try {
    if (!imageUrl || typeof imageUrl !== "string") return null;
    const trimmed = imageUrl.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return null;
    }

    const origin = new URL(trimmed).origin;
    const response = await fetch(trimmed, {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Referer: origin,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });

    if (!response.ok) return null;

    const contentType = (response.headers.get("content-type") || "image/jpeg")
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (
      !ALLOWED_MIME_TYPES.has(contentType) &&
      !contentType.startsWith("image/") &&
      !contentType.includes("octet-stream")
    ) {
      return null;
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 600 || bytes.length > MAX_IMAGE_BYTES) return null;

    return await uploadImageBuffer(bytes, contentType, storagePathOrOptions);
  } catch (error) {
    console.error(
      "uploadImageFromUrl fetch error:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

export type UploadedArticleMedia = {
  coverImage: string | null;
  uploadedImages: string[];
};

export type UploadedMedia = {
  coverImage: string | null;
  uploadedImages: string[];
};

export async function uploadImagesFromUrls(
  imageUrls: string[],
  options: {
    folder: "articles" | "events" | "news";
    slugHint: string;
    maxImages?: number;
  }
): Promise<UploadedMedia> {
  const safeSlug = safePathSegment(options.slugHint);
  const basePath = `${options.folder}/${safeSlug || "draft"}/${Date.now()}`;
  const maxImages = options.maxImages ?? 4;
  const uploadedImages: string[] = [];

  for (let i = 0; i < imageUrls.length && i < maxImages; i++) {
    const label = i === 0 ? "cover" : `inline-${i}`;
    const publicUrl = await uploadImageFromUrl(
      imageUrls[i],
      `${basePath}/${label}`
    );

    if (publicUrl) {
      uploadedImages.push(publicUrl);
    }
  }

  return {
    coverImage: uploadedImages[0] ?? null,
    uploadedImages,
  };
}

export async function uploadArticleImagesFromUrls(
  imageUrls: string[],
  slugHint: string,
  options?: { maxImages?: number }
): Promise<UploadedArticleMedia> {
  return uploadImagesFromUrls(imageUrls, {
    folder: "articles",
    slugHint,
    maxImages: options?.maxImages ?? 6,
  });
}

export async function uploadEventImagesFromUrls(
  imageUrls: string[],
  slugHint: string
): Promise<UploadedMedia> {
  return uploadImagesFromUrls(imageUrls, {
    folder: "events",
    slugHint,
    maxImages: 2,
  });
}

export function isSupabaseStorageUrl(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.includes("/storage/v1/object/public/media") ||
    url.includes("/storage/v1/object/authenticated/media")
  );
}

export function isStoredCleanWebpUrl(url?: string | null): boolean {
  if (!url) return false;
  return isSupabaseStorageUrl(url) && /\.webp(\?|$)/i.test(url);
}

export async function ensureStoredCoverImage(
  url: string | null | undefined,
  folder: "news" | "events" | "articles" | "places" | "uploads",
  slugHint?: string
): Promise<string | null> {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();

  // Only skip if already stored in our Supabase storage AS a .webp file
  if (isStoredCleanWebpUrl(trimmed)) {
    return trimmed;
  }

  // Download external (or non-webp) URL, strip EXIF, convert to WebP, and save to storage
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const safeSlug = safePathSegment(slugHint || "cover") || "cover";
    const storagePath = `${folder}/${safeSlug}/${Date.now()}/cover`;
    const storedUrl = await uploadImageFromUrl(trimmed, storagePath);
    return storedUrl || trimmed;
  }

  return trimmed;
}
