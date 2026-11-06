import { NextRequest, NextResponse } from "next/server";
import { importEventFromUrl } from "@/lib/ai/import-event-from-url";
import { normalizeUrlContent } from "@/lib/ai/normalize-event";
import { resolveFallbackCulturalImage } from "@/lib/ai/extract-page-images";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { getCityName, normalizeCitySlug } from "@/lib/cities/lookup";
import {
  isGoogleNewsArticleUrl,
  resolvePublisherUrl,
} from "@/lib/discovery/resolve-google-news-url";
import { slugify } from "@/lib/slugify";
import { ensureStoredCoverImage } from "@/lib/storage/upload-image-from-url";
import { resolveArtistOrEventCover } from "@/lib/events/artist-image-resolver";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = (await req.json()) as {
      topic?: string;
      sourceUrl?: string;
      cityName?: string;
    };

    const topic = body.topic?.trim() || "";
    let sourceUrl = body.sourceUrl?.trim() || "";

    if (!topic && !sourceUrl) {
      return NextResponse.json(
        { error: "Etkinlik konusu veya kaynak URL gereklidir" },
        { status: 400 }
      );
    }

    if (sourceUrl) {
      try {
        const parsed = new URL(sourceUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return NextResponse.json({ error: "Geçersiz URL" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Geçersiz URL" }, { status: 400 });
      }

      if (isGoogleNewsArticleUrl(sourceUrl)) {
        sourceUrl = await resolvePublisherUrl(sourceUrl);
      }

      const imported = await importEventFromUrl(sourceUrl, {
        fallbackTitle: topic || undefined,
      });

      const resolvedCity = normalizeCitySlug(imported.city_slug);
      const slugHint = slugify(imported.title || topic || "etkinlik");
      let coverImage = imported.cover_image || null;

      const resolvedCover = await resolveArtistOrEventCover({
        title: imported.title || topic,
        summary: imported.summary,
        event_type: imported.event_type,
        sourceCover: coverImage,
        slug: slugHint,
      });

      let finalCover = resolvedCover;
      if (
        !finalCover &&
        imported.event_type !== "konser" &&
        !(imported.title || topic).toLowerCase().includes("konser")
      ) {
        const fallbackImg = await resolveFallbackCulturalImage({
          title: imported.title || topic,
          cityName: getCityName(resolvedCity) || body.cityName,
          category: "kultur_sanat",
        });
        finalCover = await ensureStoredCoverImage(fallbackImg, "events", slugHint);
      }

      let sourceName = "";
      try {
        sourceName = new URL(sourceUrl).hostname.replace(/^www\./, "");
      } catch {
        // ignore
      }

      return NextResponse.json({
        ...imported,
        city_slug: resolvedCity,
        cover_image: finalCover,
        source_url: sourceUrl,
        source_name: sourceName,
      });
    }

    // Topic-only generation without URL
    const normalized = await normalizeUrlContent({
      url: "https://senidebekleriz.com",
      pageTitle: topic,
      pageText: `${topic}${body.cityName ? ` (${body.cityName})` : ""}`,
    });

    const resolvedCity = normalizeCitySlug(normalized.city_slug);
    const slugHint = slugify(normalized.title || topic || "etkinlik");

    const resolvedCover = await resolveArtistOrEventCover({
      title: normalized.title || topic,
      summary: normalized.summary,
      event_type: normalized.event_type,
      sourceCover: null,
      slug: slugHint,
    });

    let finalCover = resolvedCover;
    if (
      !finalCover &&
      normalized.event_type !== "konser" &&
      !(normalized.title || topic).toLowerCase().includes("konser")
    ) {
      const fallbackImg = await resolveFallbackCulturalImage({
        title: normalized.title || topic,
        cityName: getCityName(resolvedCity) || body.cityName,
        category: "kultur_sanat",
      });
      finalCover = await ensureStoredCoverImage(fallbackImg, "events", slugHint);
    }

    return NextResponse.json({
      ...normalized,
      city_slug: resolvedCity,
      cover_image: finalCover,
      source_url: null,
      source_name: null,
      ticket_url: null,
    });
  } catch (err: any) {
    console.error("ai-event-draft error:", err);
    return NextResponse.json(
      { error: err.message || "Etkinlik taslağı oluşturulamadı" },
      { status: 500 }
    );
  }
}
