import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  resolveCityCoverImage,
  type CityCoverSource,
} from "@/lib/data/city-images";
import { uploadImageFromUrl } from "@/lib/storage/upload-image-from-url";
import { updateCityCoverImage } from "@/lib/ingest/script-db";

export type CityCoverApplyResult = {
  slug: string;
  status: "success" | "skipped" | "error";
  message: string;
  url?: string;
  source?: CityCoverSource;
  note?: string;
};

type CityRow = {
  id: string;
  name: string;
  slug: string;
  wikidata_id: string | null;
  cover_image_locked: boolean | null;
};

async function loadCity(slug: string): Promise<CityRow | null> {
  const { data, error } = await supabaseAdmin
    .from("cities")
    .select("id, name, slug, wikidata_id, cover_image_locked")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as CityRow;
}

export async function suggestAndApplyCityCover(
  slug: string,
  options: { apply: boolean }
): Promise<CityCoverApplyResult> {
  const city = await loadCity(slug);
  if (!city) {
    return { slug, status: "error", message: "Şehir bulunamadı" };
  }

  if (city.cover_image_locked && options.apply) {
    return { slug, status: "skipped", message: "Kapak kilitli" };
  }

  const candidate = await resolveCityCoverImage({
    slug: city.slug,
    name: city.name,
    wikidataId: city.wikidata_id,
  });

  if (!candidate) {
    return { slug, status: "error", message: "Uygun görsel bulunamadı" };
  }

  if (!options.apply) {
    return {
      slug,
      status: "success",
      message: "Önizleme",
      url: candidate.url,
      source: candidate.source,
      note: candidate.note,
    };
  }

  const publicUrl = await uploadImageFromUrl(
    candidate.url,
    `cities/${city.slug}/cover`
  );

  if (!publicUrl) {
    return { slug, status: "error", message: "Yükleme başarısız" };
  }

  const updateError = await updateCityCoverImage(
    supabaseAdmin,
    city.id,
    publicUrl,
    "wikimedia"
  );

  if (updateError) {
    return { slug, status: "error", message: updateError };
  }

  return {
    slug,
    status: "success",
    message: "Kapak güncellendi",
    url: publicUrl,
    source: candidate.source,
    note: candidate.note,
  };
}

export async function refreshCityCovers(options: {
  source?: string;
  slugs?: string[];
}): Promise<{
  updated: number;
  skipped: number;
  failed: number;
  details: CityCoverApplyResult[];
}> {
  let query = supabaseAdmin
    .from("cities")
    .select("slug, cover_image_locked")
    .eq("is_active", true)
    .order("name");

  if (options.slugs?.length) {
    query = query.in("slug", options.slugs);
  } else if (options.source) {
    query = query.eq("cover_image_source", options.source);
  }

  const { data: cities, error } = await query;
  if (error) {
    return {
      updated: 0,
      skipped: 0,
      failed: 1,
      details: [
        { slug: "", status: "error", message: error.message },
      ],
    };
  }

  const details: CityCoverApplyResult[] = [];
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const city of cities || []) {
    if (city.cover_image_locked) {
      skipped++;
      details.push({
        slug: city.slug,
        status: "skipped",
        message: "Kapak kilitli",
      });
      continue;
    }

    const result = await suggestAndApplyCityCover(city.slug, { apply: true });
    details.push(result);

    if (result.status === "success") updated++;
    else if (result.status === "skipped") skipped++;
    else failed++;
  }

  return { updated, skipped, failed, details };
}
