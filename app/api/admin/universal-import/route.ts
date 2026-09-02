import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { classifyDiscoveryItem } from "@/lib/discovery/classify-content";
import { isGoogleNewsArticleUrl, resolvePublisherUrl } from "@/lib/discovery/resolve-google-news-url";
import { generateNewsDraft } from "@/lib/ai/generate-news";
import { generateArticleDraft } from "@/lib/ai/generate-article";
import { importEventFromUrl } from "@/lib/ai/import-event-from-url";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import { uniqueEventSlug } from "@/lib/events/slug";
import { slugify } from "@/lib/slugify";
import { normalizeCitySlug } from "@/lib/cities/lookup";
import { ensureStoredCoverImage } from "@/lib/storage/upload-image-from-url";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const rawUrl = String(body.url || "").trim();
    const targetType = body.targetType || "auto"; // "auto" | "news" | "event" | "article"

    if (!rawUrl) {
      return NextResponse.json({ error: "Lütfen geçerli bir URL girin" }, { status: 400 });
    }

    let sourceUrl = rawUrl;
    if (isGoogleNewsArticleUrl(rawUrl)) {
      sourceUrl = await resolvePublisherUrl(rawUrl);
    }

    // 1. Fetch content from the page
    const fetched = await fetchUrlContent(sourceUrl);
    const title = fetched.pageTitle || "Kültür & Sanat İçeriği";
    const snippet = fetched.pageText?.slice(0, 1000) || "";
    const sourceName = new URL(sourceUrl).hostname.replace(/^www\./, "");

    // 2. Classify if auto
    let detectedType = targetType;
    let detectedCitySlug: string | null = null;

    if (targetType === "auto") {
      const classified = await classifyDiscoveryItem({
        title,
        snippet,
        sourceName,
      });
      detectedType = classified.content_type === "skip" ? "news" : classified.content_type;
      detectedCitySlug = classified.city_slug;
    }

    // 3. Process according to type
    if (detectedType === "event") {
      const imported = await importEventFromUrl(sourceUrl, {
        fallbackTitle: title,
        fallbackText: snippet,
      });

      const slug = uniqueEventSlug(imported.title || title);
      const storedCoverImage = await ensureStoredCoverImage(imported.cover_image, "events", slug);

      const { data, error } = await supabaseAdmin
        .from("cultural_events")
        .insert({
          title: imported.title || title,
          slug,
          summary: (imported.summary || snippet || title).slice(0, 160),
          event_type: imported.event_type || "duyuru",
          status: "pending_review",
          source_name: sourceName,
          source_url: sourceUrl,
          ticket_url: imported.ticket_url || sourceUrl,
          city_slug: imported.city_slug || detectedCitySlug,
          venue_name: imported.venue_name,
          starts_at: imported.starts_at,
          ends_at: imported.ends_at,
          cover_image: storedCoverImage,
          raw_payload: {
            image_urls: imported.image_urls,
            source_url: sourceUrl,
          },
          updated_at: new Date().toISOString(),
        })
        .select("slug")
        .single();

      if (error) throw new Error(error.message);

      return NextResponse.json({
        success: true,
        type: "event",
        title: imported.title || title,
        slug: data.slug,
        editUrl: `/yonetim/etkinlikler/${data.slug}/duzenle`,
      });
    }

    if (detectedType === "article") {
      const draft = await generateArticleDraft({
        topic: title,
        sourceUrl,
        fallbackText: snippet,
        type: "guide",
      });

      const slug = slugify(draft.title || title);
      const storedCoverImage = await ensureStoredCoverImage(draft.cover_image, "articles", slug);

      const { data, error } = await supabaseAdmin
        .from("articles")
        .insert({
          title: draft.title || title,
          slug,
          excerpt: draft.excerpt,
          content: draft.content,
          cover_image: storedCoverImage,
          city_slug: normalizeCitySlug(detectedCitySlug),
          meta_description: draft.meta_description,
          is_published: false,
          updated_at: new Date().toISOString(),
        })
        .select("slug")
        .single();

      if (error) throw new Error(error.message);

      return NextResponse.json({
        success: true,
        type: "article",
        title: draft.title || title,
        slug: data.slug,
        editUrl: `/yonetim/yazilar/${data.slug}/duzenle`,
      });
    }

    // Default: Kültür Haberi
    const draft = await generateNewsDraft({
      topic: title,
      sourceUrl,
      fallbackText: snippet,
    });

    const slug = slugify(draft.title || title);
    const storedCoverImage = await ensureStoredCoverImage(draft.cover_image, "news", slug);

    const { data, error } = await supabaseAdmin
      .from("cultural_news")
      .insert({
        title: draft.title || title,
        slug,
        summary: draft.summary,
        content: draft.content,
        cover_image: storedCoverImage,
        category: draft.category || "genel",
        city_slug: normalizeCitySlug(detectedCitySlug),
        source_name: sourceName,
        source_url: sourceUrl,
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .select("slug")
      .single();

    if (error) {
      if (error.message?.includes("cultural_news") || error.message?.includes("schema cache")) {
        throw new Error(
          "Veritabanında 'cultural_news' tablosu eksik. Lütfen Supabase SQL Editor'da '015_cultural_news.sql' çalıştırın."
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      type: "news",
      title: draft.title || title,
      slug: data.slug,
      editUrl: `/yonetim/haberler/${data.slug}/duzenle`,
    });
  } catch (err: any) {
    console.error("Universal URL import error:", err);
    return NextResponse.json(
      { error: err.message || "URL içe aktarma işlemi başarısız oldu" },
      { status: 500 }
    );
  }
}
