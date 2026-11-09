import { fetchPublicResource } from "@/lib/security/public-fetch";
import { BROWSER_USER_AGENT } from "@/lib/ai/extract-page-images";
import { slugify } from "@/lib/slugify";
import { cleanPublisherText, cleanAgencySlug } from "@/lib/ai/clean-publisher";

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

export async function getSupabaseAdminClient() {
  const mod = await import("@/lib/supabase/admin");
  return mod.supabaseAdmin;
}

export function getMediaPublicUrl(path: string): string {
  const baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
  return `${baseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

export function safePathSegment(value: string): string {
  const cleanedText = cleanPublisherText(value || "");
  const rawSlug = slugify(cleanedText || value || "");
  const safeSlug = cleanAgencySlug(rawSlug);
  return (safeSlug || "gorsel").slice(0, 90).replace(/^-+|-+$/g, "");
}

function normalizeWebpStoragePath(
  storagePathOrOptions:
    | string
    | {
        folder: "news" | "events" | "articles" | "places" | "uploads";
        slugHint?: string;
        forceReprocess?: boolean;
      }
): string {
  if (typeof storagePathOrOptions === "string") {
    const withoutExt = storagePathOrOptions.replace(/\.(jpe?g|png|webp|avif|gif)$/i, "");
    const parts = withoutExt.split("/");
    const rawFilename = parts.pop() || "gorsel";
    const cleanFilename = safePathSegment(rawFilename);
    const folder = parts.join("/");
    return folder ? `${folder}/${cleanFilename}.webp` : `${cleanFilename}.webp`;
  }
  const safeSlug = safePathSegment(storagePathOrOptions.slugHint || "gorsel") || "gorsel";
  if (storagePathOrOptions.folder === "uploads") {
    const entropy = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return `uploads/${safeSlug}-${entropy}.webp`;
  }
  return `${storagePathOrOptions.folder}/${safeSlug}.webp`;
}

/**
 * Strips all EXIF/ICC/XMP metadata (after auto-orienting via EXIF orientation tag),
 * resizes oversized dimensions down to MAX_IMAGE_DIMENSION, and encodes as WebP.
 */
export async function convertBufferToCleanWebp(inputBuffer: Buffer): Promise<Buffer> {
  const sharpMod = await import("sharp");
  const sharpFn = sharpMod.default || sharpMod;
  return sharpFn(inputBuffer, { failOn: "none" })
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

  let finalBytes: Buffer = bytes;
  let finalMime = "image/webp";
  let finalPath = normalizeWebpStoragePath(storagePathOrOptions);

  try {
    finalBytes = await convertBufferToCleanWebp(bytes);
  } catch (err) {
    console.warn("[Storage] convertBufferToCleanWebp fallback to original buffer:", err);
    finalBytes = bytes;
    finalMime = ALLOWED_MIME_TYPES.has(mime) ? mime : "image/jpeg";
    if (typeof storagePathOrOptions === "string") {
      const ext = finalMime.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
      const withoutExt = storagePathOrOptions.replace(/\.(jpe?g|png|webp|avif|gif)$/i, "");
      finalPath = `${withoutExt}.${ext}`;
    }
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return null;
  }

  const supabaseAdmin = await getSupabaseAdminClient();
  const { error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .upload(finalPath, finalBytes, {
      contentType: finalMime,
      cacheControl: "31536000",
      upsert: true,
    });

  if (error) {
    console.error("uploadImageBuffer error:", error.message);
    return null;
  }

  return getMediaPublicUrl(finalPath);
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
    const response = await fetchPublicResource(trimmed, {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Referer: origin,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
      maxBytes: MAX_IMAGE_BYTES,
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
  const safeSlug = safePathSegment(options.slugHint) || "icerik";
  const maxImages = options.maxImages ?? 4;
  const uploadedImages: string[] = [];

  for (let i = 0; i < imageUrls.length && i < maxImages; i++) {
    const fileSlug = i === 0 ? safeSlug : `${safeSlug}-${i + 1}`;
    const publicUrl = await uploadImageFromUrl(
      imageUrls[i],
      `${options.folder}/${fileSlug}`
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

  // Explicitly reject web fonts or non-image file formats
  if (/\.(woff2?|ttf|eot|otf|svg|html?|php)(\?|#|$)/i.test(trimmed) || /\/fonts?\//i.test(trimmed)) {
    return null;
  }

  const safeSlug = safePathSegment(slugHint || "kapak") || "kapak";
  const expectedSuffix = `/${folder}/${safeSlug}.webp`;

  // Skip only if already stored in our Supabase storage as a clean .webp named after this slug
  const urlWithoutQuery = trimmed.split("?")[0];
  if (isStoredCleanWebpUrl(trimmed) && urlWithoutQuery.endsWith(expectedSuffix)) {
    return urlWithoutQuery;
  }

  // Download external (or differently-named) URL, strip EXIF, convert to WebP, and save as <folder>/<slug>.webp
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const storagePath = `${folder}/${safeSlug}`;
    const storedUrl = await uploadImageFromUrl(trimmed, storagePath);
    return storedUrl || trimmed;
  }

  return trimmed;
}
