import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  generateCityDescription,
  type CityDescriptionResult,
} from "@/lib/content/generate-city-description";

export type CityDescriptionApplyResult = {
  slug: string;
  status: "success" | "skipped" | "error";
  message: string;
  description?: string;
  source?: CityDescriptionResult["source"];
};

type CityRow = {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  description: string | null;
  description_source: string | null;
  wikidata_id: string | null;
};

async function loadCity(slug: string): Promise<CityRow | null> {
  const { data, error } = await supabaseAdmin
    .from("cities")
    .select(
      "id, name, slug, region, description, description_source, wikidata_id"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as CityRow;
}

export async function suggestCityDescription(
  slug: string
): Promise<CityDescriptionApplyResult> {
  const city = await loadCity(slug);
  if (!city) {
    return { slug, status: "error", message: "Şehir bulunamadı" };
  }

  const generated = await generateCityDescription({
    name: city.name,
    region: city.region,
    wikidataId: city.wikidata_id,
    existingDescription: city.description,
  });

  return {
    slug,
    status: "success",
    message: "Önizleme",
    description: generated.description,
    source: generated.source,
  };
}

export async function applyCityDescription(
  slug: string,
  options: { force?: boolean; apply?: boolean } = {}
): Promise<CityDescriptionApplyResult> {
  const city = await loadCity(slug);
  if (!city) {
    return { slug, status: "error", message: "Şehir bulunamadı" };
  }

  if (city.description_source === "manual" && !options.force) {
    return { slug, status: "skipped", message: "Manuel açıklama korundu" };
  }

  const generated = await generateCityDescription({
    name: city.name,
    region: city.region,
    wikidataId: city.wikidata_id,
    existingDescription: city.description,
  });

  if (!options.apply) {
    return {
      slug,
      status: "success",
      message: "Önizleme",
      description: generated.description,
      source: generated.source,
    };
  }

  const { error } = await supabaseAdmin
    .from("cities")
    .update({
      description: generated.description,
      description_source: "ai",
      updated_at: new Date().toISOString(),
    })
    .eq("id", city.id);

  if (error) {
    return { slug, status: "error", message: error.message };
  }

  return {
    slug,
    status: "success",
    message: "Açıklama güncellendi",
    description: generated.description,
    source: generated.source,
  };
}

export async function refreshCityDescriptions(options: {
  source?: string;
  slugs?: string[];
  force?: boolean;
}): Promise<{
  updated: number;
  skipped: number;
  failed: number;
  details: CityDescriptionApplyResult[];
}> {
  let query = supabaseAdmin
    .from("cities")
    .select("slug, description_source, intro_source_url")
    .eq("is_active", true)
    .order("name");

  if (options.slugs?.length) {
    query = query.in("slug", options.slugs);
  } else if (options.source === "valilik") {
    query = query.or(
      "description_source.eq.valilik,and(description_source.is.null,intro_source_url.not.is.null)"
    );
  } else if (options.source === "ai") {
    query = query.eq("description_source", "ai");
  }

  const { data: cities, error } = await query;

  if (error) {
    const fallback =
      error.message.includes("description_source") ||
      error.message.includes("intro_source_url")
        ? await supabaseAdmin
            .from("cities")
            .select("slug")
            .eq("is_active", true)
            .order("name")
        : null;

    if (!fallback?.data) {
      return {
        updated: 0,
        skipped: 0,
        failed: 1,
        details: [{ slug: "", status: "error", message: error.message }],
      };
    }

    const details: CityDescriptionApplyResult[] = [];
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const city of fallback.data) {
      const result = await applyCityDescription(city.slug, {
        apply: true,
        force: options.force,
      });
      details.push(result);
      if (result.status === "success") updated++;
      else if (result.status === "skipped") skipped++;
      else failed++;
    }

    return { updated, skipped, failed, details };
  }

  const details: CityDescriptionApplyResult[] = [];
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const city of cities || []) {
    if (city.description_source === "manual" && !options.force) {
      skipped++;
      details.push({
        slug: city.slug,
        status: "skipped",
        message: "Manuel açıklama korundu",
      });
      continue;
    }

    const result = await applyCityDescription(city.slug, {
      apply: true,
      force: options.force,
    });
    details.push(result);

    if (result.status === "success") updated++;
    else if (result.status === "skipped") skipped++;
    else failed++;
  }

  return { updated, skipped, failed, details };
}
