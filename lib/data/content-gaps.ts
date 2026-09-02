import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasEditorialContent } from "@/lib/content/place-quality";

const MIN_DESCRIPTION_LENGTH = 150;

export type ContentGaps = {
  placesWithoutCover: number;
  placesThinContent: number;
  placesIndexableWithoutCover: number;
  citiesWithoutCover: number;
  newsDraftCount: number;
  eventsPendingCount: number;
  eventsWithoutCover: number;
  articlesMissingMeta: number;
};

function wordCount(text: string | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function getContentGaps(): Promise<ContentGaps> {
  const [placesRes, citiesRes, eventsRes, articlesRes, newsDraftRes, eventsPendingRes] = await Promise.all([
    supabaseAdmin
      .from("places")
      .select("description, source, is_featured, cover_image")
      .eq("is_active", true),
    supabaseAdmin
      .from("cities")
      .select("cover_image")
      .eq("is_active", true),
    supabaseAdmin
      .from("cultural_events")
      .select("cover_image, is_published"),
    supabaseAdmin
      .from("articles")
      .select("meta_description, cover_image"),
    supabaseAdmin
      .from("cultural_news")
      .select("*", { count: "exact", head: true })
      .eq("is_published", false),
    supabaseAdmin
      .from("cultural_events")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
  ]);

  const places = placesRes.data || [];
  let placesWithoutCover = 0;
  let placesThinContent = 0;
  let placesIndexableWithoutCover = 0;

  for (const place of places) {
    const hasCover = Boolean(place.cover_image);
    if (!hasCover) placesWithoutCover++;
    if (wordCount(place.description) < MIN_DESCRIPTION_LENGTH) {
      placesThinContent++;
    }
    if (
      !hasCover &&
      hasEditorialContent({
        description: place.description,
        source: place.source,
        is_featured: place.is_featured,
        cover_image: place.cover_image,
      })
    ) {
      placesIndexableWithoutCover++;
    }
  }

  const cityRows = citiesRes.data || [];
  const citiesWithoutCover = cityRows.filter((c) => !c.cover_image).length;

  const events = eventsRes.data || [];
  const eventsWithoutCover = events.filter((e) => !e.cover_image).length;

  const articlesMissingMeta = (articlesRes.data || []).filter(
    (a) => !a.meta_description || !a.cover_image
  ).length;

  return {
    placesWithoutCover,
    placesThinContent,
    placesIndexableWithoutCover,
    citiesWithoutCover,
    newsDraftCount: newsDraftRes.count ?? 0,
    eventsPendingCount: eventsPendingRes.count ?? 0,
    eventsWithoutCover,
    articlesMissingMeta,
  };
}
