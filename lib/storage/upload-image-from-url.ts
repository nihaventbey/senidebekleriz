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

export async function uploadArticleImagesFromUrls(
  imageUrls: string[],
  slugHint: string
): Promise<UploadedArticleMedia> {
  const safeSlug = slugHint.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").slice(0, 80);
  const basePath = `articles/${safeSlug || "draft"}/${Date.now()}`;
  const uploadedImages: string[] = [];

  for (let i = 0; i < imageUrls.length && i < 4; i++) {
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
