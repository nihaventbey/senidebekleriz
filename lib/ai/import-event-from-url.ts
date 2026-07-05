import {
  buildTextFromFallback,
  fetchUrlContent,
} from "@/lib/ai/fetch-url-content";
import { normalizeUrlContent } from "@/lib/ai/normalize-event";
import { slugify } from "@/lib/slugify";
import { uploadEventImagesFromUrls } from "@/lib/storage/upload-image-from-url";

export type ImportEventFromUrlOptions = {
  fallbackTitle?: string | null;
  fallbackText?: string | null;
};

export async function importEventFromUrl(
  url: string,
  options?: ImportEventFromUrlOptions
) {
  let sourceUrl = url;
  let pageTitle = options?.fallbackTitle || undefined;
  let pageText = "";
  let imageUrls: string[] = [];

  const fallbackText = buildTextFromFallback({
    title: options?.fallbackTitle,
    text: options?.fallbackText,
  });

  try {
    const fetched = await fetchUrlContent(url, {
      maxTextLength: 8000,
      userAgent: "SeniDeBekleriz/1.0 (cultural events aggregator)",
      fallbackText: options?.fallbackText || undefined,
      minTextLength: fallbackText.length >= 40 ? 40 : 80,
    });

    sourceUrl = fetched.url;
    pageTitle = fetched.pageTitle || pageTitle;
    pageText = fetched.pageText;
    imageUrls = fetched.imageUrls;
  } catch (error) {
    if (fallbackText.length < 40) {
      throw error instanceof Error
        ? error
        : new Error("Sayfa içeriği alınamadı");
    }

    pageText = fallbackText;
    pageTitle = pageTitle || options?.fallbackTitle || undefined;
  }

  if (pageText.length < 40) {
    throw new Error("Sayfadan yeterli metin çıkarılamadı");
  }

  const normalized = await normalizeUrlContent({
    url: sourceUrl,
    pageTitle,
    pageText,
  });

  const media = await uploadEventImagesFromUrls(
    imageUrls,
    slugify(normalized.title || pageTitle || "event")
  );

  return {
    ...normalized,
    source_url: sourceUrl,
    ticket_url: normalized.ticket_url || sourceUrl,
    cover_image: media.coverImage,
    image_urls: media.uploadedImages,
  };
}
