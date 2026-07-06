import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ScrapedBelediyePlace } from "@/lib/ingest/belediye-scraper";

export type BelediyeBridgeOptions = {
  force?: boolean;
  dryRun?: boolean;
};

export type BelediyeBridgeResult = {
  slug: string;
  status: "success" | "skipped" | "error";
  message: string;
  placesUpserted: number;
};

export function createBelediyeBridgeClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local)"
    );
  }
  return createClient(url, key);
}

async function logSync(
  db: SupabaseClient,
  entityId: string,
  status: "success" | "error",
  message: string
): Promise<void> {
  await db.from("sync_logs").insert({
    source: "belediye",
    entity_type: "city",
    entity_id: entityId,
    status,
    message: message.slice(0, 500),
  });
}

export async function bridgeBelediyePlacesToSupabase(
  db: SupabaseClient,
  citySlug: string,
  places: ScrapedBelediyePlace[],
  options: BelediyeBridgeOptions
): Promise<BelediyeBridgeResult> {
  if (places.length === 0) {
    return {
      slug: citySlug,
      status: "skipped",
      message: "Çekilecek mekan bulunamadı",
      placesUpserted: 0,
    };
  }

  const { data: city } = await db
    .from("cities")
    .select("id, slug")
    .eq("slug", citySlug)
    .maybeSingle();

  if (!city) {
    const message = "Şehir bulunamadı";
    if (!options.dryRun) await logSync(db, citySlug, "error", message);
    return {
      slug: citySlug,
      status: "error",
      message,
      placesUpserted: 0,
    };
  }

  const { data: tarihiCategory } = await db
    .from("categories")
    .select("id")
    .eq("slug", "tarihi-yer")
    .maybeSingle();

  let upserted = 0;

  for (const place of places) {
    const { data: existing } = await db
      .from("places")
      .select("id, source, slug")
      .eq("slug", place.slug)
      .maybeSingle();

    if (
      existing &&
      existing.source !== "belediye" &&
      !options.force
    ) {
      continue;
    }

    const row = {
      city_id: city.id,
      name: place.name,
      slug: place.slug,
      description: place.description,
      website: place.website,
      source: "belediye",
      source_url: place.sourceUrl,
      cover_image: place.coverImage,
      cover_image_source: place.coverImage ? "belediye" : null,
      is_active: true,
      is_featured: false,
      updated_at: new Date().toISOString(),
    };

    if (options.dryRun) {
      upserted++;
      continue;
    }

    const { data: saved, error } = await db
      .from("places")
      .upsert(row, { onConflict: "slug" })
      .select("id")
      .single();

    if (error) {
      if (!options.dryRun) {
        await logSync(
          db,
          citySlug,
          "error",
          `${place.slug}: ${error.message}`
        );
      }
      continue;
    }

    upserted++;

    if (tarihiCategory && saved?.id) {
      await db.from("place_categories").upsert(
        {
          place_id: saved.id,
          category_id: tarihiCategory.id,
        },
        { onConflict: "place_id,category_id" }
      );
    }
  }

  const message =
    options.dryRun
      ? `${upserted} mekan dry-run`
      : `${upserted} mekan kaydedildi`;

  if (!options.dryRun) {
    await logSync(db, citySlug, "success", message);
  }

  return {
    slug: citySlug,
    status: upserted > 0 ? "success" : "skipped",
    message,
    placesUpserted: upserted,
  };
}
