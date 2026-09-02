import { supabaseAdmin } from "@/lib/supabase/admin";

export const MEDIA_BUCKET = "media";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

function extensionFromUrl(url: string): string | null {
  const match = url.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
  if (!match) return null;
  return match[1].toLowerCase().replace("jpeg", "jpg");
}

export function getMediaPublicUrl(path: string): string {
  const { data } = supabaseAdmin.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadImageBuffer(
  bytes: Buffer,
  contentType: string,
  storagePath: string
): Promise<string | null> {
  const mime = contentType.split(";")[0].trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) return null;
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;

  const ext = extensionForMime(mime);
  const pathWithExt = storagePath.includes(".")
    ? storagePath
    : `${storagePath}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .upload(pathWithExt, bytes, {
      contentType: mime,
      cacheControl: "31536000",
      upsert: true,
    });

  if (error) {
    console.error("uploadImageBuffer error:", error.message);
    return null;
  }

  return getMediaPublicUrl(pathWithExt);
}

export async function uploadImageFromUrl(
  imageUrl: string,
  storagePath: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "SeniDeBekleriz/1.0 (media import)",
        Accept: "image/*",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });

    if (!response.ok) return null;

    const contentType = (response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (!ALLOWED_MIME_TYPES.has(contentType)) return null;

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;

    const ext = extensionFromUrl(imageUrl) || extensionForMime(contentType);
    const pathWithExt = storagePath.includes(".")
      ? storagePath
      : `${storagePath}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .upload(pathWithExt, bytes, {
        contentType,
        cacheControl: "31536000",
        upsert: true,
      });

    if (error) {
      console.error("uploadImageFromUrl error:", error.message);
      return null;
    }

    return getMediaPublicUrl(pathWithExt);
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

function safePathSegment(value: string): string {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").slice(0, 80);
}

export async function uploadImagesFromUrls(
  imageUrls: string[],
  options: {
    folder: "articles" | "events";
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

export async function ensureStoredCoverImage(
  url: string | null | undefined,
  folder: "news" | "events" | "articles" | "places",
  slugHint: string
): Promise<string | null> {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();

  // If already stored in our Supabase storage, return as-is
  if (isSupabaseStorageUrl(trimmed)) {
    return trimmed;
  }

  // If it's an external HTTP/HTTPS URL, download and save to storage upon confirmation
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const safeSlug = safePathSegment(slugHint || "cover");
    const storagePath = `${folder}/${safeSlug}/${Date.now()}/cover`;
    const storedUrl = await uploadImageFromUrl(trimmed, storagePath);
    return storedUrl || trimmed;
  }

  return trimmed;
}
