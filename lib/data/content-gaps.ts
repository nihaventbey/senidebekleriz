import { supabaseAdmin } from "@/lib/supabase/admin";
import { shouldIndexPlace } from "@/lib/content/place-quality";

const MIN_DESCRIPTION_LENGTH = 150;

export type ContentGaps = {
  placesWithoutCover: number;
  placesThinContent: number;
  placesIndexableWithoutCover: number;
  citiesWithoutCover: number;
  citiesValilikCover: number;
  eventsWithoutCover: number;
  articlesMissingMeta: number;
};

function wordCount(text: string | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function getContentGaps(): Promise<ContentGaps> {
  const [placesRes, citiesRes, eventsRes, articlesRes] = await Promise.all([
    supabaseAdmin
      .from("places")
      .select("description, source, is_featured, cover_image")
      .eq("is_active", true),
    supabaseAdmin
      .from("cities")
      .select("cover_image, cover_image_source")
      .eq("is_active", true),
    supabaseAdmin
      .from("cultural_events")
      .select("cover_image, is_published")
      .eq("is_published", true),
    supabaseAdmin
      .from("articles")
      .select("meta_description, cover_image"),
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
      shouldIndexPlace({
        description: place.description,
        source: place.source,
        is_featured: place.is_featured,
      })
    ) {
      placesIndexableWithoutCover++;
    }
  }

  let cityRows = citiesRes.data || [];
  if (citiesRes.error?.message.includes("cover_image_source")) {
    const fallback = await supabaseAdmin
      .from("cities")
      .select("cover_image")
      .eq("is_active", true);
    cityRows = (fallback.data || []).map((c) => ({
      cover_image: c.cover_image,
      cover_image_source: null,
    }));
  }

  const citiesWithoutCover = cityRows.filter((c) => !c.cover_image).length;
  const citiesValilikCover = cityRows.filter(
    (c) => c.cover_image && c.cover_image_source === "valilik"
  ).length;

  const eventsWithoutCover = (eventsRes.data || []).filter(
    (e) => !e.cover_image
  ).length;

  const articlesMissingMeta = (articlesRes.data || []).filter(
    (a) => !a.meta_description || !a.cover_image
  ).length;

  return {
    placesWithoutCover,
    placesThinContent,
    placesIndexableWithoutCover,
    citiesWithoutCover,
    citiesValilikCover,
    eventsWithoutCover,
    articlesMissingMeta,
  };
}
